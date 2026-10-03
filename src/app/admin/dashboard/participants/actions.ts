"use server"

import { revalidatePath } from "next/cache"

import { sql } from "@/lib/db"

export type VerifyResult = { ok: boolean; message?: string }

/**
 * Confirm a pending win. Prize decrement stays as-is.
 * Idempotent via the Pending guard: a row already Confirmed/Rejected is a no-op.
 */
export async function passVerification(
  scratchResultId: string,
): Promise<VerifyResult> {
  const updated = (await sql`
    UPDATE scratch_results
    SET verification_status = 'Confirmed'
    WHERE id = ${scratchResultId}
      AND verification_status = 'Pending'
    RETURNING id
  `) as { id: string }[]

  if (updated.length === 0) {
    return { ok: false, message: "Already resolved or not pending." }
  }

  revalidatePath("/admin/dashboard/imei-registry")
  revalidatePath("/admin/dashboard/participants")
  revalidatePath("/admin/dashboard/scratch-rewards")
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
  const updated = (await sql`
    UPDATE scratch_results s
    SET verification_status = 'Rejected'
    FROM participants p
    WHERE s.id = ${scratchResultId}
      AND s.verification_status = 'Pending'
      AND s.outcome IN ('SilverKite', 'SilverCoin')
      AND p.id = s.participant_id
    RETURNING s.outcome, p.campaign_id
  `) as { outcome: "SilverKite" | "SilverCoin"; campaign_id: string }[]

  if (updated.length === 0) {
    return { ok: false, message: "Already resolved or not a pending win." }
  }

  const { outcome, campaign_id } = updated[0]!

  await sql`
    UPDATE rewards
    SET distributed = GREATEST(distributed - 1, 0)
    WHERE campaign_id = ${campaign_id} AND kind = ${outcome}::reward_kind
  `

  revalidatePath("/admin/dashboard/imei-registry")
  revalidatePath("/admin/dashboard/participants")
  revalidatePath("/admin/dashboard/scratch-rewards")
  return { ok: true }
}
