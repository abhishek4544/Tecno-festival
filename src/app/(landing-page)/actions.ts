'use server';

import { isIP } from 'node:net';
import { headers } from 'next/headers';

import { z } from 'zod';

import { sql } from '@/lib/db';
import {
  ENTRY_RECAPTCHA_ACTION,
  RECAPTCHA_ERROR_MESSAGE,
} from '@/lib/recaptcha';
import { verifyRecaptcha } from '@/lib/verify-recaptcha';

import { entryFormSchema, type EntryFormInput } from '@/schemas';
import { retailerAddresses, type ScratchPrize } from './_data';

// Failed attempts allowed per IP inside the window before entries are refused.
// IMEIs are effectively lottery tickets, so this slows down guessing.
const MAX_FAILED_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW = '15 minutes';

type ValidationResult =
  | 'Eligible'
  | 'IMEINotFound'
  | 'IMEIAlreadyUsed'
  | 'IMEIBlocked'
  | 'CampaignNotStarted'
  | 'CampaignExpired'
  | 'RateLimited'
  | 'SystemError'
  // Not stored in participation_attempts (no matching DB enum value).
  | 'RecaptchaFailed';

export type EntryPrize = ScratchPrize['kind'];

export type SubmitEntryResult =
  | { ok: true; prize: EntryPrize | null }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<keyof EntryFormInput, string>>;
    };

type Campaign = {
  id: string;
  scratch_enabled: boolean;
  has_started: boolean;
  has_ended: boolean;
};

type ClaimRow = {
  imei_status: 'Unused' | 'Used' | 'Blocked' | null;
  participant_id: string | null;
  prize: EntryPrize | null;
};

const IMEI_ERRORS: Partial<Record<ValidationResult, string>> = {
  IMEINotFound:
    'This IMEI isn’t registered for the campaign. Please check the number.',
  IMEIAlreadyUsed: 'This IMEI has already been used to enter.',
  IMEIBlocked: 'This IMEI can’t be used to enter. Please contact support.',
};

const MESSAGES: Partial<Record<ValidationResult, string>> = {
  CampaignNotStarted:
    'The lucky draw hasn’t started yet. Please check back soon.',
  CampaignExpired: 'The lucky draw has ended. Thank you for your interest.',
  RateLimited: 'Too many attempts. Please wait a few minutes and try again.',
  RecaptchaFailed: RECAPTCHA_ERROR_MESSAGE,
  SystemError: 'Something went wrong. Please try again.',
};

function failure(result: ValidationResult): SubmitEntryResult {
  const imeiError = IMEI_ERRORS[result];
  return imeiError
    ? { ok: false, fieldErrors: { imeiNumber: imeiError } }
    : { ok: false, message: MESSAGES[result] ?? MESSAGES.SystemError };
}

async function getClient() {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || headerList.get('x-real-ip');

  return {
    // `ip_address` is an inet column, so drop anything that isn't an address.
    ip: ip && isIP(ip) ? ip : null,
    userAgent: headerList.get('user-agent'),
  };
}

export async function submitEntry(
  input: EntryFormInput,
  recaptchaToken: string | null,
): Promise<SubmitEntryResult> {
  // Re-validate on the server: this action is reachable by direct POST.
  const parsed = entryFormSchema.safeParse(input);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        Object.entries(fieldErrors).map(([field, errors]) => [
          field,
          errors?.[0],
        ]),
      ),
    };
  }

  const values = parsed.data;
  const retailerAddress = retailerAddresses.find(
    (option) => option.value === values.retailerAddress,
  );
  if (!retailerAddress) {
    return {
      ok: false,
      fieldErrors: { retailerAddress: 'Please select the retailer’s address' },
    };
  }

  const client = await getClient();

  const isHuman = await verifyRecaptcha(
    recaptchaToken,
    ENTRY_RECAPTCHA_ACTION,
    client.ip,
  );
  if (!isHuman) return failure('RecaptchaFailed');

  try {
    const [campaign] = (await sql`
      SELECT
        id,
        scratch_enabled,
        now() >= start_at AS has_started,
        now() > end_at AS has_ended
      FROM campaigns
      WHERE status = 'Active'
      ORDER BY start_at DESC
      LIMIT 1
    `) as Campaign[];

    if (!campaign) return { ok: false, message: MESSAGES.CampaignNotStarted };

    async function logAttempt(result: ValidationResult) {
      try {
        await sql`
          INSERT INTO participation_attempts (
            campaign_id, submitted_imei, submitted_name, submitted_mobile,
            retailer_name, result, ip_address, user_agent
          ) VALUES (
            ${campaign.id}, ${values.imeiNumber}, ${values.fullName},
            ${values.mobileNumber}, ${values.retailerStoreName},
            ${result}::validation_result, ${client.ip}::inet, ${client.userAgent}
          )
        `;
      } catch (error) {
        // Logging must never block an entry.
        console.error('Failed to log participation attempt', error);
      }
    }

    async function reject(result: ValidationResult) {
      await logAttempt(result);
      return failure(result);
    }

    if (!campaign.has_started) return reject('CampaignNotStarted');
    if (campaign.has_ended) return reject('CampaignExpired');

    if (client.ip) {
      const [{ failed }] = (await sql`
        SELECT count(*)::int AS failed
        FROM participation_attempts
        WHERE campaign_id = ${campaign.id}
          AND ip_address = ${client.ip}::inet
          AND result <> 'Eligible'
          AND attempted_at > now() - ${RATE_LIMIT_WINDOW}::interval
      `) as { failed: number }[];

      if (failed >= MAX_FAILED_ATTEMPTS) return reject('RateLimited');
    }

    // One statement so the IMEI claim and prize stock update are atomic:
    // - the participants unique (campaign_id, imei) key stops double entries,
    // - `distributed < total` is re-checked under the row lock, so concurrent
    //   winners can't push a reward past its stock.
    const [claim] = (await sql`
      WITH registry AS (
        SELECT id, status, assigned_prize
        FROM imei_registry
        WHERE campaign_id = ${campaign.id} AND imei = ${values.imeiNumber}
      ),
      participant AS (
        INSERT INTO participants (
          campaign_id, full_name, mobile, imei, imei_registry_id,
          retailer_name, retailer_address
        )
        SELECT
          ${campaign.id}, ${values.fullName}, ${values.mobileNumber},
          ${values.imeiNumber}, registry.id, ${values.retailerStoreName},
          ${retailerAddress.label}
        FROM registry
        WHERE registry.status = 'Unused'
        ON CONFLICT (campaign_id, imei) DO NOTHING
        RETURNING id
      ),
      reward AS (
        UPDATE rewards
        SET distributed = distributed + 1
        WHERE campaign_id = ${campaign.id}
          AND ${campaign.scratch_enabled}
          AND kind = (SELECT assigned_prize FROM registry)
          AND kind IN ('SilverKite', 'SilverCoin')
          AND distributed < total
          AND EXISTS (SELECT 1 FROM participant)
        RETURNING kind
      ),
      scratch AS (
        INSERT INTO scratch_results (participant_id, outcome, verification_status)
        SELECT
          participant.id,
          COALESCE((SELECT kind::text FROM reward), 'TryAgain')::scratch_outcome,
          CASE
            WHEN EXISTS (SELECT 1 FROM reward) THEN 'Pending'::verification_status
          END
        FROM participant
        RETURNING outcome
      ),
      registry_update AS (
        UPDATE imei_registry
        SET
          validation_attempts = validation_attempts + 1,
          status = CASE
            WHEN EXISTS (SELECT 1 FROM participant) THEN 'Used'::imei_status
            ELSE status
          END
        WHERE id = (SELECT id FROM registry)
      )
      SELECT
        (SELECT status FROM registry) AS imei_status,
        (SELECT id FROM participant) AS participant_id,
        (SELECT kind FROM reward) AS prize
    `) as ClaimRow[];

    if (!claim.participant_id) {
      return reject(
        claim.imei_status === null
          ? 'IMEINotFound'
          : claim.imei_status === 'Blocked'
            ? 'IMEIBlocked'
            : 'IMEIAlreadyUsed',
      );
    }

    await logAttempt('Eligible');
    return { ok: true, prize: claim.prize };
  } catch (error) {
    console.error('Failed to submit entry', error);
    return failure('SystemError');
  }
}
