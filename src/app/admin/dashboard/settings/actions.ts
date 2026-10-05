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
      | "startAt"
      | "endAt"
      | "silverKitePerWeek"
      | "silverKiteDay"
      | "silverCoinStock"
      | "silverKiteStock"
      | CoinTierFieldKey,
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
  const coinStock = parseIntField(formData.get("silverCoinStock"))
  const kiteStock = parseIntField(formData.get("silverKiteStock"))
  // "random" (or blank) = let the draw pick any time in the week.
  const kiteDayRaw = String(formData.get("silverKiteDay") ?? "").trim()
  const kiteDay = kiteDayRaw === "" || kiteDayRaw === "random" ? null : kiteDayRaw

  const fieldErrors: SaveSettingsState["fieldErrors"] = { ...coin.errors }
  if (!startAt) fieldErrors.startAt = "Start date is required."
  if (!endAt) fieldErrors.endAt = "End date is required."
  if (startAt && endAt && startAt > endAt) {
    fieldErrors.endAt = "End date must be after start date."
  }
  if (kitePerWeek === null) {
    fieldErrors.silverKitePerWeek = "Enter a non-negative whole number."
  }
  if (coinStock === null) {
    fieldErrors.silverCoinStock = "Enter a non-negative whole number."
  }
  if (kiteStock === null) {
    fieldErrors.silverKiteStock = "Enter a non-negative whole number."
  }

  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Invalid status." }
  }
  if (Object.keys(fieldErrors).length > 0 || !coin.tiers) {
    return { ok: false, fieldErrors }
  }

  const coinTiers = coin.tiers

  const campaign = await getCampaignSettings()
  if (!campaign) return { ok: false, message: "No active campaign." }

  // Stock is the hard ceiling take_reward enforces on top of the daily/weekly
  // draw; it can't drop below what winners have already been given.
  if ((coinStock as number) < campaign.silverCoin.distributed) {
    fieldErrors.silverCoinStock = `Already distributed ${campaign.silverCoin.distributed}. Stock can't be lower than that.`
  }
  if ((kiteStock as number) < campaign.silverKite.distributed) {
    fieldErrors.silverKiteStock = `Already distributed ${campaign.silverKite.distributed}. Stock can't be lower than that.`
  }
  const week = campaign.silverKiteWeek
  const kiteDayChanged = kiteDay !== week.selectedDay
  if (kiteDayChanged) {
    const day = week.days.find((d) => d.value === kiteDay)
    if (startAt !== campaign.startAt) {
      // The week (and so the valid days) moves with the start date.
      fieldErrors.silverKiteDay =
        "Start date changed. Save it first, then pick the kite day for the new week."
    } else if (kiteDay !== null && !day) {
      fieldErrors.silverKiteDay = "Pick a day inside the current week."
    } else if (day?.unavailable) {
      fieldErrors.silverKiteDay =
        "No peak hours (6 AM–10 PM) left on that day this week."
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors }
  }

  const statements = [
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
      VALUES (${campaign.id}, 'SilverCoin', ${coinStock})
      ON CONFLICT (campaign_id, kind)
      DO UPDATE SET total = EXCLUDED.total
    `,
    sql`
      INSERT INTO rewards (campaign_id, kind, total)
      VALUES (${campaign.id}, 'SilverKite', ${kiteStock})
      ON CONFLICT (campaign_id, kind)
      DO UPDATE SET total = EXCLUDED.total
    `,
  ]

  if (kiteDayChanged) {
    statements.push(sql`
      UPDATE campaigns SET period_overrides =
        COALESCE(period_overrides, '{}'::jsonb) || jsonb_build_object(
          'silverKiteDays',
          (COALESCE(period_overrides -> 'silverKiteDays', '{}'::jsonb) - ${week.key}::text)
            || ${JSON.stringify(kiteDay ? { [week.key]: kiteDay } : {})}::jsonb
        )
      WHERE id = ${campaign.id}
    `)
  }

  // claim_entry draws the week's winning times once, when the week's first
  // entry arrives. Re-draw the not-yet-awarded ones whenever the day or the
  // weekly count changes so the change applies to the current week. With a
  // kite day, one kite lands on that day and the rest on the other days.
  if (kiteDayChanged || kitePerWeek !== campaign.silverKitePerWeek) {
    statements.push(
      sql`
        INSERT INTO gift_draws (campaign_id, kind, period_start, entries, winning_times)
        SELECT
          c.id,
          'SilverKite',
          w.ws,
          (
            SELECT count(*) FROM participants p
            WHERE p.campaign_id = c.id AND p.participated_at >= w.ws
          ),
          '{}'::timestamptz[]
        FROM campaigns c,
          LATERAL (
            SELECT c.start_at
              + floor(extract(epoch FROM now() - c.start_at) / 604800)
                * interval '7 days' AS ws
          ) w
        WHERE c.id = ${campaign.id}
        ON CONFLICT (campaign_id, kind, period_start) DO NOTHING
      `,
      sql`
        WITH w AS (
          SELECT
            c.id,
            c.silver_kite_per_week AS per_week,
            c.period_overrides,
            c.start_at
              + floor(extract(epoch FROM now() - c.start_at) / 604800)
                * interval '7 days' AS ws
          FROM campaigns c
          WHERE c.id = ${campaign.id}
        ),
        d AS (
          SELECT
            *,
            (
              period_overrides -> 'silverKiteDays'
                ->> to_char(ws AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
            )::date AS day
          FROM w
        ),
        b AS (
          SELECT
            id,
            ws,
            per_week,
            day IS NOT NULL AS has_day,
            ws + interval '7 days' AS we,
            day::timestamp AT TIME ZONE 'Asia/Kathmandu' AS day_start,
            (day::timestamp + interval '1 day') AT TIME ZONE 'Asia/Kathmandu'
              AS day_end
          FROM d
        ),
        -- Every still-upcoming minute of the week inside peak sales hours
        -- (06:00–22:00 Nepal time), tagged with whether it's on the kite day.
        slots AS (
          SELECT
            s,
            COALESCE(s >= b.day_start AND s < b.day_end, false) AS on_day
          FROM b,
            generate_series(
              date_trunc('minute', GREATEST(b.ws, now())) + interval '1 minute',
              b.we - interval '1 minute',
              interval '1 minute'
            ) s
          WHERE extract(hour FROM s AT TIME ZONE 'Asia/Kathmandu') BETWEEN 6 AND 21
        ),
        cur AS (
          SELECT
            b.*,
            g.awarded,
            -- Times already used by awarded kites are kept; the rest are redrawn.
            COALESCE(g.winning_times[1:g.awarded], '{}'::timestamptz[]) AS kept
          FROM gift_draws g
          JOIN b ON g.campaign_id = b.id
            AND g.kind = 'SilverKite'
            AND g.period_start = b.ws
        ),
        n AS (
          SELECT
            *,
            -- Exactly one kite on the kite day, unless one was already won on it.
            CASE
              WHEN has_day
                AND per_week > awarded
                AND EXISTS (SELECT 1 FROM slots WHERE on_day)
                AND NOT EXISTS (
                  SELECT 1 FROM unnest(kept) t
                  WHERE t >= day_start AND t < day_end
                )
              THEN 1
              ELSE 0
            END AS day_count
          FROM cur
        )
        UPDATE gift_draws g
        SET winning_times = n.kept || ARRAY(
          SELECT t FROM (
            (
              SELECT s + random() * interval '1 minute' AS t
              FROM slots WHERE on_day
              ORDER BY random()
              LIMIT n.day_count
            )
            UNION ALL
            (
              -- The rest of the week's kites go on the other days only.
              SELECT s + random() * interval '1 minute'
              FROM slots WHERE NOT on_day
              ORDER BY random()
              LIMIT GREATEST(n.per_week - n.awarded - n.day_count, 0)
            )
          ) picks
          ORDER BY t
        )
        FROM n
        WHERE g.campaign_id = n.id
          AND g.kind = 'SilverKite'
          AND g.period_start = n.ws
      `,
    )
  }

  try {
    await sql.transaction(statements)
  } catch {
    return { ok: false, message: "Could not save settings." }
  }

  const tiersLabel = (list: SilverCoinTier[]) =>
    sortTiers(list)
      .map(
        (t, i, sorted) =>
          `${t.upTo === null ? `>${sorted[i - 1]?.upTo ?? 0}` : `≤${t.upTo}`}:${t.coins}`,
      )
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
    [
      `Silver Kite day (week ${week.number})`,
      week.selectedDay ?? "Random",
      kiteDay ?? "Random",
    ],
    [
      "Silver Coin stock",
      String(campaign.silverCoin.total),
      String(coinStock),
    ],
    [
      "Silver Kite stock",
      String(campaign.silverKite.total),
      String(kiteStock),
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
