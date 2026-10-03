"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/audit-log"
import { requireAdmin } from "@/lib/auth"
import { sql } from "@/lib/db"

export type VerifyResult = { ok: boolean; message?: string }

type ResolvedWin = {
  outcome: "SilverKite" | "SilverCoin"
  campaign_id: string
  participant_id: string
  full_name: string
  imei: string
}

const OUTCOME_LABELS: Record<ResolvedWin["outcome"], string> = {
  SilverKite: "Silver Kite",
  SilverCoin: "Silver Coin",
}

/**
 * Confirm a pending win. Prize decrement stays as-is.
 * Idempotent via the Pending guard: a row already Confirmed/Rejected is a no-op.
 */
export async function passVerification(
  scratchResultId: string,
): Promise<VerifyResult> {
  await requireAdmin()
  const updated = (await sql`
    UPDATE scratch_results s
    SET verification_status = 'Confirmed'
    FROM participants p
    WHERE s.id = ${scratchResultId}
      AND s.verification_status = 'Pending'
      AND p.id = s.participant_id
    RETURNING s.outcome, p.campaign_id, p.id AS participant_id, p.full_name, p.imei
  `) as ResolvedWin[]

  if (updated.length === 0) {
    return { ok: false, message: "Already resolved or not pending." }
  }

  const win = updated[0]!
  await logAdminAction({
    action: "verification.pass",
    summary: `Passed ${OUTCOME_LABELS[win.outcome]} win for ${win.full_name} (IMEI ${win.imei})`,
    campaignId: win.campaign_id,
    entityType: "participant",
    entityId: win.participant_id,
    details: { scratchResultId, outcome: win.outcome, imei: win.imei },
  })

  revalidatePath("/admin/dashboard/imei-registry")
  revalidatePath("/admin/dashboard/participants")
  return { ok: true }
}

/**
 * Reject a pending win and return the prize to stock. The two writes are
 * ordered: flip status first (guarded by Pending), then decrement the matching
 * reward row only if we actually flipped. `distributed` is clamped at zero.
 */
export async function failVerification(
  scratchResultId: string,
): Promise<VerifyResult> {
  await requireAdmin()
  const updated = (await sql`
    UPDATE scratch_results s
    SET verification_status = 'Rejected'
    FROM participants p
    WHERE s.id = ${scratchResultId}
      AND s.verification_status = 'Pending'
      AND s.outcome IN ('SilverKite', 'SilverCoin')
      AND p.id = s.participant_id
    RETURNING s.outcome, p.campaign_id, p.id AS participant_id, p.full_name, p.imei
  `) as ResolvedWin[]

  if (updated.length === 0) {
    return { ok: false, message: "Already resolved or not a pending win." }
  }

  const { outcome, campaign_id, participant_id, full_name, imei } = updated[0]!

  await sql`
    UPDATE rewards
    SET distributed = GREATEST(distributed - 1, 0)
    WHERE campaign_id = ${campaign_id} AND kind = ${outcome}::reward_kind
  `

  await logAdminAction({
    action: "verification.fail",
    summary: `Failed ${OUTCOME_LABELS[outcome]} win for ${full_name} (IMEI ${imei}); prize returned to stock`,
    campaignId: campaign_id,
    entityType: "participant",
    entityId: participant_id,
    details: { scratchResultId, outcome, imei },
  })

  revalidatePath("/admin/dashboard/imei-registry")
  revalidatePath("/admin/dashboard/participants")
  return { ok: true }
}
