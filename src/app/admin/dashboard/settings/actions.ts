"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/audit-log"
import { requireAdmin } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getCampaignSettings } from "@/lib/db-queries"
import { sortTiers } from "@/lib/silver-coin-tiers"
import type { CampaignStatus, SilverCoinTier } from "@/lib/types"

const STATUSES: CampaignStatus[] = [
  "Draft",
  "Scheduled",
  "Active",
  "Paused",
  "Completed",
]

type TierIndex = "0" | "1" | "2"
type CoinTierFieldKey =
  | `silverCoinTier${TierIndex}UpTo`
  | `silverCoinTier${TierIndex}Coins`

export type SaveSettingsState = {
  ok: boolean
  message?: string
  fieldErrors?: Partial<
    Record<
      "startAt" | "endAt" | "silverKitePerWeek" | CoinTierFieldKey,
      string
    >
  >
}

/** Parse a non-negative integer or return null when the input is blank/invalid. */
function parseIntField(raw: FormDataEntryValue | null): number | null {
  const str = String(raw ?? "").trim()
  if (str === "") return null
  const n = Number(str)
  return Number.isInteger(n) && n >= 0 ? n : null
}

type CoinTierParseOutput = {
  tiers: SilverCoinTier[] | null
  errors: Partial<Record<CoinTierFieldKey, string>>
}

/** Pull the three Silver Coin tier rows out of FormData, validating as we go. */
function parseCoinTiers(formData: FormData): CoinTierParseOutput {
  const t0UpTo = parseIntField(formData.get("silverCoinTier0UpTo"))
  const t0Coins = parseIntField(formData.get("silverCoinTier0Coins"))
  const t1UpTo = parseIntField(formData.get("silverCoinTier1UpTo"))
  const t1Coins = parseIntField(formData.get("silverCoinTier1Coins"))
  const t2Coins = parseIntField(formData.get("silverCoinTier2Coins"))

  const errors: Partial<Record<CoinTierFieldKey, string>> = {}
  if (t0UpTo === null || t0UpTo < 1) {
    errors.silverCoinTier0UpTo = "Enter a positive sales threshold."
  }
  if (t1UpTo === null || t1UpTo < 1) {
    errors.silverCoinTier1UpTo = "Enter a positive sales threshold."
  }
  if (t0UpTo !== null && t1UpTo !== null && t1UpTo <= t0UpTo) {
    errors.silverCoinTier1UpTo = "Must be greater than tier 1 threshold."
  }
  if (t0Coins === null) {
    errors.silverCoinTier0Coins = "Enter a non-negative number."
  }
  if (t1Coins === null) {
    errors.silverCoinTier1Coins = "Enter a non-negative number."
  }
  if (t2Coins === null) {
    errors.silverCoinTier2Coins = "Enter a non-negative number."
  }

  if (Object.keys(errors).length > 0) return { tiers: null, errors }

  return {
    tiers: sortTiers([
      { upTo: t0UpTo as number, coins: t0Coins as number },
      { upTo: t1UpTo as number, coins: t1Coins as number },
      { upTo: null, coins: t2Coins as number },
    ]),
    errors,
  }
}

export async function saveCampaignSettings(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  await requireAdmin()
  const startAt = String(formData.get("startAt") ?? "").trim()
  const endAt = String(formData.get("endAt") ?? "").trim()
  const status = String(formData.get("status") ?? "") as CampaignStatus

  const coin = parseCoinTiers(formData)
  const kitePerWeek = parseIntField(formData.get("silverKitePerWeek"))

  const fieldErrors: SaveSettingsState["fieldErrors"] = { ...coin.errors }
  if (!startAt) fieldErrors.startAt = "Start date is required."
  if (!endAt) fieldErrors.endAt = "End date is required."
  if (startAt && endAt && startAt > endAt) {
    fieldErrors.endAt = "End date must be after start date."
  }
  if (kitePerWeek === null) {
    fieldErrors.silverKitePerWeek = "Enter a non-negative whole number."
  }

  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Invalid status." }
  }
  if (Object.keys(fieldErrors).length > 0 || !coin.tiers) {
    return { ok: false, fieldErrors }
  }

  const coinTiers = coin.tiers
  const coinMax = Math.max(...coinTiers.map((t) => t.coins))

  const campaign = await getCampaignSettings()
  if (!campaign) return { ok: false, message: "No active campaign." }

  // Any tier whose cap is below current distributed would make it impossible
  // to retroactively honor past wins; block the save.
  if (coinMax < campaign.silverCoin.distributed) {
    fieldErrors.silverCoinTier2Coins = `Already distributed ${campaign.silverCoin.distributed}. The highest tier must allow at least that many coins.`
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors }
  }

  // Rough upper bound on Silver Kite stock across the campaign:
  // (ceiling of weeks between start and end) × kites per week, floored at
  // what's already been distributed. Keeps rewards.total sensible for the
  // Scratch Rewards page and for take_reward's safety check.
  const weeksInCampaign = Math.max(
    1,
    Math.ceil(
      (new Date(endAt).getTime() - new Date(startAt).getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    ),
  )
  const kiteTotal = Math.max(
    campaign.silverKite.distributed,
    (kitePerWeek as number) * weeksInCampaign,
  )

  try {
    await sql.transaction([
      sql`
        UPDATE campaigns SET
          start_at = ${startAt}::date,
          end_at = ${endAt}::date,
          status = ${status}::campaign_status,
          silver_coin_tiers = ${JSON.stringify(coinTiers)}::jsonb,
          silver_kite_per_week = ${kitePerWeek},
          updated_at = now()
        WHERE id = ${campaign.id}
      `,
      sql`
        INSERT INTO rewards (campaign_id, kind, total)
        VALUES (${campaign.id}, 'SilverCoin', ${coinMax})
        ON CONFLICT (campaign_id, kind)
        DO UPDATE SET total = EXCLUDED.total
      `,
      sql`
        INSERT INTO rewards (campaign_id, kind, total)
        VALUES (${campaign.id}, 'SilverKite', ${kiteTotal})
        ON CONFLICT (campaign_id, kind)
        DO UPDATE SET total = EXCLUDED.total
      `,
    ])
  } catch {
    return { ok: false, message: "Could not save settings." }
  }

  const tiersLabel = (list: SilverCoinTier[]) =>
    list
      .map((t) => `${t.upTo === null ? "200+" : `≤${t.upTo}`}:${t.coins}`)
      .join(", ")
  const changes = [
    ["Start date", campaign.startAt, startAt],
    ["End date", campaign.endAt, endAt],
    ["Status", campaign.status, status],
    [
      "Silver Coin tiers",
      tiersLabel(campaign.silverCoinTiers),
      tiersLabel(coinTiers),
    ],
    [
      "Silver Kite / week",
      String(campaign.silverKitePerWeek),
      String(kitePerWeek),
    ],
  ].filter(([, from, to]) => from !== to)

  if (changes.length > 0) {
    await logAdminAction({
      action: "settings.update",
      summary: changes
        .map(([label, from, to]) => `${label}: ${from} → ${to}`)
        .join("; "),
      campaignId: campaign.id,
      entityType: "campaign",
      entityId: campaign.id,
      details: {
        changes: changes.map(([field, from, to]) => ({ field, from, to })),
      },
    })
  }

  revalidatePath("/admin/dashboard/settings")
  revalidatePath("/admin/dashboard")
  return { ok: true }
}
