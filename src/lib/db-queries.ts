import "server-only"
import { sql } from "@/lib/db"
import type { Paginated } from "@/lib/pagination"
import type {
  AssignedPrize,
  CampaignStatus,
  ImeiRecord,
  ImeiRegistryStatus,
  ImeiSource,
  ParticipantRow,
  ScratchOutcome,
  ScratchOutcomeDb,
  SilverCoinTier,
  VerificationStatus,
} from "@/lib/types"

const scratchDbToDisplay: Record<ScratchOutcomeDb, ScratchOutcome> = {
  SilverKite: "Silver Kite",
  SilverCoin: "Silver Coin",
  TryAgain: "Try Again",
  Pending: "Pending",
}

export type ActiveCampaign = {
  id: string
  name: string
  code: string
  status: CampaignStatus
}

export async function getActiveCampaign(): Promise<ActiveCampaign | null> {
  const rows = (await sql`
    SELECT id, name, code, status
    FROM campaigns
    WHERE status = 'Active'
    ORDER BY start_at DESC
    LIMIT 1
  `) as ActiveCampaign[]
  return rows[0] ?? null
}

export type ImeiFilters = {
  /** Digits to match anywhere in the IMEI; "" for no search. */
  query: string
  status: ImeiRegistryStatus | null
  /** "none" = no prize assigned. */
  prize: "none" | "SilverCoin" | "SilverKite" | null
  page: number
  pageSize: number
}

type ImeiJsonRow = {
  id: string
  imei: string
  device_model: string | null
  batch_code: string | null
  status: ImeiRegistryStatus
  validation_attempts: number
  source: ImeiSource
  assigned_prize: AssignedPrize
  added_at: string
  participant_name: string | null
  expected_retailer: string | null
}

type PageResult<T> = {
  campaign_id: string | null
  total_all: number
  total: number
  offset: number
  rows: T[]
}

/**
 * One page of the active campaign's IMEI registry, in a single round trip.
 * The registry status shown in the admin (Winning Pending, Claimed, ...) is
 * derived from the scratch result, so filtering on it happens in SQL too.
 */
export async function listImeisPage(
  filters: ImeiFilters,
): Promise<Paginated<ImeiRecord>> {
  const { status, prize, pageSize } = filters
  const query = filters.query.replace(/\D/g, "")
  const offset = (filters.page - 1) * pageSize

  const [result] = (await sql`
    WITH campaign AS (
      SELECT id FROM campaigns
      WHERE status = 'Active'
      ORDER BY start_at DESC
      LIMIT 1
    ),
    registry AS (
      SELECT
        i.id,
        i.imei,
        i.device_model,
        i.batch_code,
        CASE
          WHEN i.status = 'Blocked' THEN 'Blocked'
          WHEN s.outcome IN ('SilverKite', 'SilverCoin') THEN
            CASE s.verification_status
              WHEN 'Confirmed' THEN 'Claimed'
              WHEN 'Rejected' THEN 'Rejected'
              ELSE 'Winning Pending'
            END
          WHEN s.outcome = 'TryAgain' THEN 'Used'
          ELSE i.status::text
        END AS status,
        i.validation_attempts,
        i.source,
        i.assigned_prize,
        i.added_at,
        i.expected_retailer,
        p.full_name AS participant_name
      FROM imei_registry i
      JOIN campaign c ON c.id = i.campaign_id
      LEFT JOIN participants p
        ON p.campaign_id = i.campaign_id AND p.imei = i.imei
      LEFT JOIN scratch_results s ON s.participant_id = p.id
    ),
    filtered AS (
      SELECT * FROM registry
      WHERE (${status}::text IS NULL OR status = ${status}::text)
        AND (
          ${prize}::text IS NULL
          OR (${prize}::text = 'none' AND assigned_prize IS NULL)
          OR assigned_prize::text = ${prize}::text
        )
        AND (${query}::text = '' OR imei LIKE '%' || ${query}::text || '%')
    ),
    paging AS (
      -- Clamp past-the-end pages to the last page that has rows.
      SELECT
        count(*)::int AS total,
        LEAST(
          ${offset}::int,
          GREATEST((count(*)::int - 1) / ${pageSize}::int, 0) * ${pageSize}::int
        ) AS "offset"
      FROM filtered
    )
    SELECT
      (SELECT id FROM campaign) AS campaign_id,
      (SELECT count(*)::int FROM registry) AS total_all,
      paging.total,
      paging."offset",
      COALESCE(
        (
          SELECT json_agg(r ORDER BY r.added_at, r.imei)
          FROM (
            SELECT * FROM filtered
            ORDER BY added_at, imei
            LIMIT ${pageSize}::int
            OFFSET (SELECT "offset" FROM paging)
          ) r
        ),
        '[]'
      ) AS rows
    FROM paging
  `) as PageResult<ImeiJsonRow>[]

  return {
    campaignId: result.campaign_id,
    total: result.total,
    totalAll: result.total_all,
    page: result.offset / pageSize + 1,
    pageSize,
    rows: result.rows.map((r) => ({
      id: r.id,
      imei: r.imei,
      deviceModel: r.device_model ?? "",
      batch: r.batch_code ?? "",
      status: r.status,
      validationAttempts: r.validation_attempts,
      participantName: r.participant_name,
      addedAt: r.added_at,
      source: r.source,
      assignedPrize: r.assigned_prize,
      expectedRetailer: r.expected_retailer,
    })),
  }
}

export type CampaignSettings = {
  id: string
  name: string
  code: string
  startAt: string // YYYY-MM-DD
  endAt: string
  status: CampaignStatus
  termsUrl: string
  silverKite: { total: number; distributed: number }
  silverCoin: { total: number; distributed: number }
  /** Cumulative sales-based cap for Silver Coin. */
  silverCoinTiers: SilverCoinTier[]
  /** How many Silver Kites get drawn per weekly window. */
  silverKitePerWeek: number
}

export async function getCampaignSettings(): Promise<CampaignSettings | null> {
  const campaign = await getActiveCampaign()
  if (!campaign) return null

  const rows = (await sql`
    SELECT
      c.id,
      c.name,
      c.code,
      to_char(c.start_at, 'YYYY-MM-DD') AS "startAt",
      to_char(c.end_at, 'YYYY-MM-DD') AS "endAt",
      c.status,
      COALESCE(c.terms_url, '') AS "termsUrl",
      c.silver_coin_tiers AS "silverCoinTiers",
      c.silver_kite_per_week AS "silverKitePerWeek"
    FROM campaigns c
    WHERE c.id = ${campaign.id}
  `) as Array<Omit<CampaignSettings, "silverKite" | "silverCoin">>

  const rewardRows = (await sql`
    SELECT kind, total, distributed
    FROM rewards
    WHERE campaign_id = ${campaign.id}
  `) as Array<{ kind: "SilverKite" | "SilverCoin" | "GoldKite"; total: number; distributed: number }>

  const sk = rewardRows.find((r) => r.kind === "SilverKite")
  const sc = rewardRows.find((r) => r.kind === "SilverCoin")

  return {
    ...rows[0]!,
    silverKite: { total: sk?.total ?? 0, distributed: sk?.distributed ?? 0 },
    silverCoin: { total: sc?.total ?? 0, distributed: sc?.distributed ?? 0 },
  }
}

export type ParticipantFilters = {
  /** Matches name, mobile, IMEI, store name or district; "" for no search. */
  query: string
  /** "none" = no verification (non-winners). */
  verification: VerificationStatus | "none" | null
  scratch: ScratchOutcomeDb | null
  page: number
  pageSize: number
}

type ParticipantJsonRow = {
  id: string
  name: string
  mobile: string
  imei: string
  retailer_entered: string
  retailer_address: string | null
  retailer_expected: string | null
  scratch_result_id: string | null
  scratch: ScratchOutcomeDb
  verification: VerificationStatus | null
  participated_at: string
}

/** One page of the active campaign's participants, newest first, in a single round trip. */
export async function listParticipantsPage(
  filters: ParticipantFilters,
): Promise<Paginated<ParticipantRow>> {
  const { verification, scratch, pageSize } = filters
  // Escape LIKE wildcards so a search for "50%" matches literally.
  const query = filters.query.trim().replace(/[\\%_]/g, "\\$&")
  const offset = (filters.page - 1) * pageSize

  const [result] = (await sql`
    WITH campaign AS (
      SELECT id FROM campaigns
      WHERE status = 'Active'
      ORDER BY start_at DESC
      LIMIT 1
    ),
    entries AS (
      SELECT
        p.id,
        p.full_name AS name,
        p.mobile,
        p.imei,
        p.retailer_name AS retailer_entered,
        p.retailer_address,
        i.expected_retailer AS retailer_expected,
        s.id AS scratch_result_id,
        COALESCE(s.outcome, 'Pending') AS scratch,
        s.verification_status AS verification,
        p.participated_at
      FROM participants p
      JOIN campaign c ON c.id = p.campaign_id
      LEFT JOIN scratch_results s ON s.participant_id = p.id
      LEFT JOIN imei_registry i
        ON i.campaign_id = p.campaign_id AND i.imei = p.imei
    ),
    filtered AS (
      SELECT * FROM entries
      WHERE (
          ${verification}::text IS NULL
          OR (${verification}::text = 'none' AND verification IS NULL)
          OR verification::text = ${verification}::text
        )
        AND (${scratch}::text IS NULL OR scratch::text = ${scratch}::text)
        AND (
          ${query}::text = ''
          OR name ILIKE '%' || ${query}::text || '%'
          OR mobile LIKE '%' || ${query}::text || '%'
          OR imei LIKE '%' || ${query}::text || '%'
          OR retailer_entered ILIKE '%' || ${query}::text || '%'
          OR retailer_address ILIKE '%' || ${query}::text || '%'
        )
    ),
    paging AS (
      -- Clamp past-the-end pages to the last page that has rows.
      SELECT
        count(*)::int AS total,
        LEAST(
          ${offset}::int,
          GREATEST((count(*)::int - 1) / ${pageSize}::int, 0) * ${pageSize}::int
        ) AS "offset"
      FROM filtered
    )
    SELECT
      (SELECT id FROM campaign) AS campaign_id,
      (SELECT count(*)::int FROM entries) AS total_all,
      paging.total,
      paging."offset",
      COALESCE(
        (
          SELECT json_agg(r ORDER BY r.participated_at DESC, r.id)
          FROM (
            SELECT * FROM filtered
            ORDER BY participated_at DESC, id
            LIMIT ${pageSize}::int
            OFFSET (SELECT "offset" FROM paging)
          ) r
        ),
        '[]'
      ) AS rows
    FROM paging
  `) as PageResult<ParticipantJsonRow>[]

  return {
    campaignId: result.campaign_id,
    total: result.total,
    totalAll: result.total_all,
    page: result.offset / pageSize + 1,
    pageSize,
    rows: result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      mobile: r.mobile,
      imei: r.imei,
      retailerEntered: r.retailer_entered,
      retailerAddress: r.retailer_address,
      retailerExpected: r.retailer_expected,
      scratchResultId: r.scratch_result_id,
      scratch: scratchDbToDisplay[r.scratch],
      verification: r.verification,
      participatedAt: r.participated_at,
    })),
  }
}

export type RecentParticipant = {
  id: string
  name: string
  imei: string
  retailer: string
  retailerAddress: string | null
  scratch: ScratchOutcome
  participatedAt: string
}

/** Newest entries for the admin notifications panel. */
export async function listRecentParticipants(
  limit: number,
): Promise<RecentParticipant[]> {
  const rows = (await sql`
    SELECT
      p.id,
      p.full_name AS name,
      p.imei,
      p.retailer_name AS retailer,
      p.retailer_address,
      COALESCE(s.outcome, 'Pending') AS scratch,
      p.participated_at
    FROM participants p
    JOIN campaigns c ON c.id = p.campaign_id AND c.status = 'Active'
    LEFT JOIN scratch_results s ON s.participant_id = p.id
    ORDER BY p.participated_at DESC
    LIMIT ${limit}
  `) as Array<{
    id: string
    name: string
    imei: string
    retailer: string
    retailer_address: string | null
    scratch: ScratchOutcomeDb
    participated_at: Date
  }>

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    imei: r.imei,
    retailer: r.retailer,
    retailerAddress: r.retailer_address,
    scratch: scratchDbToDisplay[r.scratch],
    participatedAt: new Date(r.participated_at).toISOString(),
  }))
}

export const AUDIT_LOG_GROUPS = ["admin", "imei", "verification", "settings"] as const
export type AuditLogGroup = (typeof AUDIT_LOG_GROUPS)[number]

export type AuditLogRow = {
  id: string
  action: string
  summary: string
  ip: string | null
  createdAt: string
}

export type AuditLogFilters = {
  /** Action prefix, e.g. "imei" matches imei.add / imei.prize / imei.import. */
  group: AuditLogGroup | null
  page: number
  pageSize: number
}

/** One page of admin activity, newest first, in a single round trip. */
export async function listAuditLogsPage(
  filters: AuditLogFilters,
): Promise<Omit<Paginated<AuditLogRow>, "campaignId">> {
  const { group, pageSize } = filters
  const offset = (filters.page - 1) * pageSize

  const [result] = (await sql`
    WITH filtered AS (
      SELECT id, action, meta, created_at
      FROM audit_logs
      WHERE ${group}::text IS NULL OR action LIKE ${group}::text || '.%'
    ),
    paging AS (
      -- Clamp past-the-end pages to the last page that has rows.
      SELECT
        count(*)::int AS total,
        LEAST(
          ${offset}::int,
          GREATEST((count(*)::int - 1) / ${pageSize}::int, 0) * ${pageSize}::int
        ) AS "offset"
      FROM filtered
    )
    SELECT
      (SELECT count(*)::int FROM audit_logs) AS total_all,
      paging.total,
      paging."offset",
      COALESCE(
        (
          SELECT json_agg(r ORDER BY r.created_at DESC, r.id)
          FROM (
            SELECT * FROM filtered
            ORDER BY created_at DESC, id
            LIMIT ${pageSize}::int
            OFFSET (SELECT "offset" FROM paging)
          ) r
        ),
        '[]'
      ) AS rows
    FROM paging
  `) as Array<
    Omit<PageResult<unknown>, "campaign_id" | "rows"> & {
      rows: Array<{
        id: string
        action: string
        meta: { summary?: string; ip?: string | null } | null
        created_at: string
      }>
    }
  >

  return {
    total: result.total,
    totalAll: result.total_all,
    page: result.offset / pageSize + 1,
    pageSize,
    rows: result.rows.map((r) => ({
      id: r.id,
      action: r.action,
      summary: r.meta?.summary ?? r.action,
      ip: r.meta?.ip ?? null,
      createdAt: r.created_at,
    })),
  }
}

export type OverviewStats = {
  campaign: {
    name: string
    startAt: string
    endAt: string
  } | null
  participants: number
  participantsToday: number
  pending: number
  confirmed: number
  tryAgain: number
  coinsToday: number
  kitesThisWeek: number
  silverKite: { total: number; distributed: number }
  silverCoin: { total: number; distributed: number }
  /** Live tier config so the dashboard's today-draw card stays in sync. */
  silverCoinTiers: SilverCoinTier[]
  silverKitePerWeek: number
}

/**
 * Everything the dashboard overview shows, in one round trip. "Today" is the
 * Nepal day and "this week" the campaign week, matching the prize draw.
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  const [r] = (await sql`
    WITH campaign AS (
      SELECT id, name, start_at, end_at, silver_coin_tiers, silver_kite_per_week
      FROM campaigns
      WHERE status = 'Active'
      ORDER BY start_at DESC
      LIMIT 1
    ),
    bounds AS (
      SELECT
        date_trunc('day', now() AT TIME ZONE 'Asia/Kathmandu')
          AT TIME ZONE 'Asia/Kathmandu' AS day_start,
        c.start_at
          + floor(extract(epoch FROM now() - c.start_at) / 604800)
            * interval '7 days' AS week_start
      FROM campaign c
    ),
    entries AS (
      SELECT p.participated_at, s.outcome, s.verification_status
      FROM participants p
      JOIN campaign c ON c.id = p.campaign_id
      LEFT JOIN scratch_results s ON s.participant_id = p.id
    ),
    stock AS (
      SELECT r.kind, r.total, r.distributed
      FROM rewards r
      JOIN campaign c ON c.id = r.campaign_id
    )
    SELECT
      (
        SELECT json_build_object(
          'name', name,
          'startAt', to_char(start_at AT TIME ZONE 'Asia/Kathmandu', 'YYYY-MM-DD'),
          'endAt', to_char(end_at AT TIME ZONE 'Asia/Kathmandu', 'YYYY-MM-DD')
        )
        FROM campaign
      ) AS campaign,
      (SELECT count(*)::int FROM entries) AS participants,
      (
        SELECT count(*)::int FROM entries, bounds
        WHERE participated_at >= day_start
      ) AS participants_today,
      (
        SELECT count(*)::int FROM entries
        WHERE verification_status = 'Pending'
      ) AS pending,
      (
        SELECT count(*)::int FROM entries
        WHERE verification_status = 'Confirmed'
      ) AS confirmed,
      (SELECT count(*)::int FROM entries WHERE outcome = 'TryAgain') AS try_again,
      (
        SELECT count(*)::int FROM entries, bounds
        WHERE outcome = 'SilverCoin' AND participated_at >= day_start
      ) AS coins_today,
      (
        SELECT count(*)::int FROM entries, bounds
        WHERE outcome = 'SilverKite' AND participated_at >= week_start
      ) AS kites_this_week,
      (SELECT total FROM stock WHERE kind = 'SilverKite') AS sk_total,
      (SELECT distributed FROM stock WHERE kind = 'SilverKite') AS sk_distributed,
      (SELECT total FROM stock WHERE kind = 'SilverCoin') AS sc_total,
      (SELECT distributed FROM stock WHERE kind = 'SilverCoin') AS sc_distributed,
      (SELECT silver_coin_tiers FROM campaign) AS silver_coin_tiers,
      (SELECT silver_kite_per_week FROM campaign) AS silver_kite_per_week
  `) as Array<{
    campaign: OverviewStats["campaign"]
    participants: number
    participants_today: number
    pending: number
    confirmed: number
    try_again: number
    coins_today: number
    kites_this_week: number
    sk_total: number | null
    sk_distributed: number | null
    sc_total: number | null
    sc_distributed: number | null
    silver_coin_tiers: SilverCoinTier[] | null
    silver_kite_per_week: number | null
  }>

  return {
    campaign: r.campaign,
    participants: r.participants,
    participantsToday: r.participants_today,
    pending: r.pending,
    confirmed: r.confirmed,
    tryAgain: r.try_again,
    coinsToday: r.coins_today,
    kitesThisWeek: r.kites_this_week,
    silverKite: { total: r.sk_total ?? 0, distributed: r.sk_distributed ?? 0 },
    silverCoin: { total: r.sc_total ?? 0, distributed: r.sc_distributed ?? 0 },
    silverCoinTiers: r.silver_coin_tiers ?? [],
    silverKitePerWeek: r.silver_kite_per_week ?? 0,
  }
}
