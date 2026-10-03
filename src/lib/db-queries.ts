import "server-only"
import { sql } from "@/lib/db"
import type {
  AssignedPrize,
  CampaignStatus,
  ImeiRecord,
  ImeiStatus,
  ImeiSource,
  ParticipantRow,
  ScratchOutcome,
  ScratchOutcomeDb,
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

type ImeiRow = {
  id: string
  imei: string
  device_model: string | null
  batch_code: string | null
  status: ImeiStatus
  validation_attempts: number
  source: ImeiSource
  assigned_prize: AssignedPrize
  added_at: string
  participant_name: string | null
  scratch_outcome: ScratchOutcomeDb | null
  verification_status: VerificationStatus | null
  expected_retailer: string | null
}

export async function listImeis(campaignId: string): Promise<ImeiRecord[]> {
  const rows = (await sql`
    SELECT
      i.id,
      i.imei,
      i.device_model,
      i.batch_code,
      i.status,
      i.validation_attempts,
      i.source,
      i.assigned_prize,
      i.added_at,
      i.expected_retailer,
      p.full_name AS participant_name,
      s.outcome AS scratch_outcome,
      s.verification_status
    FROM imei_registry i
    LEFT JOIN participants p
      ON p.campaign_id = i.campaign_id AND p.imei = i.imei
    LEFT JOIN scratch_results s ON s.participant_id = p.id
    WHERE i.campaign_id = ${campaignId}
    ORDER BY i.added_at ASC
  `) as ImeiRow[]

  return rows.map((r) => ({
    id: r.id,
    imei: r.imei,
    deviceModel: r.device_model ?? "",
    batch: r.batch_code ?? "",
    status: r.status === "Blocked"
      ? "Blocked"
      : r.scratch_outcome === "SilverKite" || r.scratch_outcome === "SilverCoin"
        ? r.verification_status === "Confirmed"
          ? "Claimed"
          : r.verification_status === "Rejected"
            ? "Rejected"
            : "Winning Pending"
        : r.scratch_outcome === "TryAgain" ? "Used" : r.status,
    validationAttempts: r.validation_attempts,
    participantName: r.participant_name,
    addedAt: r.added_at,
    source: r.source,
    assignedPrize: r.assigned_prize,
    expectedRetailer: r.expected_retailer,
  }))
}

export type CampaignSettings = {
  id: string
  name: string
  code: string
  startAt: string // YYYY-MM-DD
  endAt: string
  status: CampaignStatus
  termsUrl: string
  scratchEnabled: boolean
  goldKiteEnabled: boolean
  silverKite: { total: number; distributed: number }
  silverCoin: { total: number; distributed: number }
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
      c.scratch_enabled AS "scratchEnabled",
      c.gold_kite_enabled AS "goldKiteEnabled"
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

type ParticipantQueryRow = {
  id: string
  name: string
  mobile: string
  imei: string
  retailer_entered: string
  retailer_expected: string | null
  scratch: ScratchOutcomeDb | null
  verification: VerificationStatus | null
  participated_at: string
}

export async function listParticipants(campaignId: string): Promise<ParticipantRow[]> {
  const rows = (await sql`
    SELECT
      p.id,
      p.full_name AS name,
      p.mobile,
      p.imei,
      p.retailer_name AS retailer_entered,
      i.expected_retailer AS retailer_expected,
      s.outcome AS scratch,
      s.verification_status AS verification,
      p.participated_at
    FROM participants p
    LEFT JOIN scratch_results s ON s.participant_id = p.id
    LEFT JOIN imei_registry i
      ON i.campaign_id = p.campaign_id AND i.imei = p.imei
    WHERE p.campaign_id = ${campaignId}
    ORDER BY p.participated_at DESC
  `) as ParticipantQueryRow[]

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    mobile: r.mobile,
    imei: r.imei,
    retailerEntered: r.retailer_entered,
    retailerExpected: r.retailer_expected,
    scratch: r.scratch ? scratchDbToDisplay[r.scratch] : "Pending",
    verification: r.verification,
    participatedAt: r.participated_at,
  }))
}

