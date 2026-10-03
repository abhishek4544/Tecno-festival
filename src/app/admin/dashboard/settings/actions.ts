"use server"

import { revalidatePath } from "next/cache"

import { sql } from "@/lib/db"
import { getActiveCampaign } from "@/lib/db-queries"
import type { CampaignStatus } from "@/lib/types"

export type SaveSettingsState = {
  ok: boolean
  message?: string
  fieldErrors?: Partial<
    Record<"startAt" | "endAt" | "silverKiteTotal" | "silverCoinTotal", string>
  >
}

const STATUSES: CampaignStatus[] = [
  "Draft",
  "Scheduled",
  "Active",
  "Paused",
  "Completed",
]

export async function saveCampaignSettings(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  const startAt = String(formData.get("startAt") ?? "").trim()
  const endAt = String(formData.get("endAt") ?? "").trim()
  const status = String(formData.get("status") ?? "") as CampaignStatus
  const scratchEnabled = formData.get("scratchEnabled") === "on"
  const goldKiteEnabled = formData.get("goldKiteEnabled") === "on"
  const silverKiteTotal = Number(formData.get("silverKiteTotal") ?? 0)
  const silverCoinTotal = Number(formData.get("silverCoinTotal") ?? 0)

  const fieldErrors: SaveSettingsState["fieldErrors"] = {}
  if (!startAt) fieldErrors.startAt = "Start date is required."
  if (!endAt) fieldErrors.endAt = "End date is required."
  if (startAt && endAt && startAt > endAt) {
    fieldErrors.endAt = "End date must be after start date."
  }
  if (!Number.isFinite(silverKiteTotal) || silverKiteTotal < 0) {
    fieldErrors.silverKiteTotal = "Enter a non-negative number."
  }
  if (!Number.isFinite(silverCoinTotal) || silverCoinTotal < 0) {
    fieldErrors.silverCoinTotal = "Enter a non-negative number."
  }
  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Invalid status." }
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors }
  }

  const campaign = await getActiveCampaign()
  if (!campaign) return { ok: false, message: "No active campaign." }

  const distributed = (await sql`
    SELECT kind, distributed FROM rewards WHERE campaign_id = ${campaign.id}
  `) as Array<{ kind: "SilverKite" | "SilverCoin" | "GoldKite"; distributed: number }>
  const skDist = distributed.find((r) => r.kind === "SilverKite")?.distributed ?? 0
  const scDist = distributed.find((r) => r.kind === "SilverCoin")?.distributed ?? 0
  if (silverKiteTotal < skDist) {
    fieldErrors.silverKiteTotal = `Already distributed ${skDist}. Cannot lower below that.`
  }
  if (silverCoinTotal < scDist) {
    fieldErrors.silverCoinTotal = `Already distributed ${scDist}. Cannot lower below that.`
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors }
  }

  try {
    await sql.transaction([
      sql`
        UPDATE campaigns SET
          start_at = ${startAt}::date,
          end_at = ${endAt}::date,
          status = ${status}::campaign_status,
          scratch_enabled = ${scratchEnabled},
          gold_kite_enabled = ${goldKiteEnabled},
          updated_at = now()
        WHERE id = ${campaign.id}
      `,
      sql`
        INSERT INTO rewards (campaign_id, kind, total)
        VALUES (${campaign.id}, 'SilverKite', ${silverKiteTotal})
        ON CONFLICT (campaign_id, kind)
        DO UPDATE SET total = EXCLUDED.total
      `,
      sql`
        INSERT INTO rewards (campaign_id, kind, total)
        VALUES (${campaign.id}, 'SilverCoin', ${silverCoinTotal})
        ON CONFLICT (campaign_id, kind)
        DO UPDATE SET total = EXCLUDED.total
      `,
    ])
  } catch {
    return { ok: false, message: "Could not save settings." }
  }

  revalidatePath("/admin/dashboard/settings")
  revalidatePath("/admin/dashboard/scratch-rewards")
  revalidatePath("/admin/dashboard")
  return { ok: true }
}
