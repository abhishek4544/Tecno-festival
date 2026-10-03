"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/audit-log"
import { requireAdmin } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getActiveCampaign } from "@/lib/db-queries"
import type { AssignedPrize } from "@/lib/types"

const IMEI_RE_SHARED = /^\d{15}$/

const PRIZE_LABELS: Record<NonNullable<AssignedPrize>, string> = {
  SilverKite: "Silver Kite",
  SilverCoin: "Silver Coin",
  GoldKite: "Gold Kite",
}

function prizeLabel(prize: AssignedPrize) {
  return prize ? PRIZE_LABELS[prize] : "Random Gift"
}

// Values accepted from the Add IMEI form. Gold Kite is NOT assignable — it's
// a lottery over valid entries drawn at campaign close.
const PRIZE_INPUT_VALUES = ["SilverKite", "SilverCoin"] as const
type PrizeInput = (typeof PRIZE_INPUT_VALUES)[number] | ""

export type AddImeiState = {
  ok: boolean
  message?: string
  fieldErrors?: Partial<Record<"imei" | "deviceModel", string>>
}

export async function addImei(
  _prev: AddImeiState,
  formData: FormData,
): Promise<AddImeiState> {
  await requireAdmin()
  const imei = String(formData.get("imei") ?? "").trim()
  const deviceModel = String(formData.get("deviceModel") ?? "").trim() || null
  const batch = String(formData.get("batch") ?? "").trim() || null
  const notes = String(formData.get("notes") ?? "").trim() || null
  const prizeRaw = String(formData.get("prize") ?? "")
  const prize: AssignedPrize =
    prizeRaw === "" ? null
    : (PRIZE_INPUT_VALUES as readonly string[]).includes(prizeRaw)
      ? (prizeRaw as PrizeInput as AssignedPrize)
      : null // reject any other value (incl. forged "GoldKite") — assign no prize

  const fieldErrors: AddImeiState["fieldErrors"] = {}
  if (!IMEI_RE_SHARED.test(imei)) fieldErrors.imei = "IMEI must be exactly 15 digits."
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  const campaign = await getActiveCampaign()
  if (!campaign) return { ok: false, message: "No active campaign found." }

  let imeiId: string
  try {
    const [row] = (await sql`
      INSERT INTO imei_registry (
        campaign_id, imei, device_model, batch_code,
        source, assigned_prize, notes
      ) VALUES (
        ${campaign.id}, ${imei}, ${deviceModel}, ${batch},
        'Manual', ${prize}, ${notes}
      )
      RETURNING id
    `) as { id: string }[]
    imeiId = row!.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (/duplicate key value/.test(message) && /campaign_id, imei/.test(message)) {
      return {
        ok: false,
        fieldErrors: { imei: "This IMEI is already in the registry." },
      }
    }
    return { ok: false, message: "Could not save IMEI." }
  }

  await logAdminAction({
    action: "imei.add",
    summary: `Added IMEI ${imei} (prize: ${prizeLabel(prize)})`,
    campaignId: campaign.id,
    entityType: "imei",
    entityId: imeiId,
    details: { imei, deviceModel, batch, prize },
  })

  revalidatePath("/admin/dashboard/imei-registry")
  return { ok: true }
}

export type SetPrizeResult = { ok: boolean; message?: string }

// Prize values an admin can assign per-IMEI. Gold Kite is NOT here — it's
// a lottery over valid entries, not a pre-mark on an IMEI.
type AssignablePrize = Extract<AssignedPrize, "SilverCoin" | "SilverKite"> | null

/** Assign (or clear) a prize for a single IMEI. Silver Kite / Silver Coin only. */
export async function setPrize(
  imeiId: string,
  prize: AssignablePrize,
): Promise<SetPrizeResult> {
  await requireAdmin()
  const campaign = await getActiveCampaign()
  if (!campaign) return { ok: false, message: "No active campaign." }

  // The self-join reads the row as it was before the update, for the log.
  const [changed] = (await sql`
    UPDATE imei_registry i
    SET assigned_prize = ${prize}::reward_kind
    FROM imei_registry before
    WHERE before.id = i.id
      AND i.campaign_id = ${campaign.id}
      AND i.id = ${imeiId}
    RETURNING i.imei, before.assigned_prize AS previous
  `) as { imei: string; previous: AssignedPrize }[]

  if (changed && changed.previous !== prize) {
    await logAdminAction({
      action: "imei.prize",
      summary: `IMEI ${changed.imei} prize: ${prizeLabel(changed.previous)} → ${prizeLabel(prize)}`,
      campaignId: campaign.id,
      entityType: "imei",
      entityId: imeiId,
      details: { imei: changed.imei, from: changed.previous, to: prize },
    })
  }

  revalidatePath("/admin/dashboard/imei-registry")
  return { ok: true }
}

// ------- Bulk import -------
//
// Shape expected from the TECNO XLSX "Retalers" sheet. Prize assignment is NOT
// part of the import — it's a per-IMEI admin action (setPrize).

export type ImportRow = {
  imei: string
  deviceModel: string
  batch: string | null
  expectedRetailer: string | null
}

export type ImportIssue = {
  row: number
  imei: string
  reason: "missing" | "invalid" | "duplicate"
}

export type ImportPreview = {
  total: number
  valid: number
  duplicates: number
  invalid: number
  missing: number
  issues: ImportIssue[]
}

export type PreviewResult =
  | { ok: true; preview: ImportPreview }
  | { ok: false; message: string }

export async function previewImeiImport(
  rows: ImportRow[],
): Promise<PreviewResult> {
  await requireAdmin()
  if (rows.length === 0) return { ok: false, message: "File is empty." }
  const campaign = await getActiveCampaign()
  if (!campaign) return { ok: false, message: "No active campaign." }

  const issues: ImportIssue[] = []
  let missing = 0
  let invalid = 0
  const candidates: string[] = []
  const normalized: Array<{
    row: number
    imei: string
    structuralValid: boolean
  }> = []

  rows.forEach((r, i) => {
    const rowNum = i + 2
    let structuralValid = true

    if (!r.imei) {
      missing++
      issues.push({ row: rowNum, imei: r.imei || "(empty)", reason: "missing" })
      structuralValid = false
    } else if (!IMEI_RE_SHARED.test(r.imei)) {
      invalid++
      issues.push({ row: rowNum, imei: r.imei, reason: "invalid" })
      structuralValid = false
    }
    if (structuralValid) candidates.push(r.imei)
    normalized.push({ row: rowNum, imei: r.imei, structuralValid })
  })

  const existingRows =
    candidates.length === 0
      ? []
      : ((await sql`
          SELECT imei FROM imei_registry
          WHERE campaign_id = ${campaign.id} AND imei = ANY(${candidates}::text[])
        `) as { imei: string }[])
  const existingSet = new Set(existingRows.map((r) => r.imei))

  const seen = new Set<string>()
  const dupInFile = new Set<string>()
  for (const imei of candidates) {
    if (seen.has(imei)) dupInFile.add(imei)
    seen.add(imei)
  }

  let valid = 0
  let duplicates = 0
  normalized.forEach((n) => {
    if (!n.structuralValid) return
    if (existingSet.has(n.imei) || dupInFile.has(n.imei)) {
      duplicates++
      issues.push({ row: n.row, imei: n.imei, reason: "duplicate" })
      return
    }
    valid++
  })

  return {
    ok: true,
    preview: {
      total: rows.length,
      valid,
      duplicates,
      invalid,
      missing,
      issues: issues.slice(0, 50),
    },
  }
}

export type CommitResult =
  | { ok: true; imported: number; duplicates: number; failed: number }
  | { ok: false; message: string }

export async function commitImeiImport(
  rows: ImportRow[],
  fileName: string,
): Promise<CommitResult> {
  await requireAdmin()
  const campaign = await getActiveCampaign()
  if (!campaign) return { ok: false, message: "No active campaign." }

  const seen = new Set<string>()
  const clean: ImportRow[] = []
  let missing = 0
  let invalid = 0

  for (const r of rows) {
    if (!r.imei) {
      missing++
      continue
    }
    if (!IMEI_RE_SHARED.test(r.imei)) {
      invalid++
      continue
    }
    if (seen.has(r.imei)) continue
    seen.add(r.imei)

    clean.push({
      imei: r.imei,
      deviceModel: r.deviceModel,
      batch: r.batch || null,
      expectedRetailer: r.expectedRetailer || null,
    })
  }

  if (clean.length === 0) {
    return { ok: false, message: "No valid rows to import." }
  }

  const batchRows = (await sql`
    INSERT INTO import_batches (campaign_id, file_name, total)
    VALUES (${campaign.id}, ${fileName}, ${rows.length})
    RETURNING id
  `) as { id: string }[]
  const batchId = batchRows[0]!.id

  const imeis = clean.map((c) => c.imei)
  const models = clean.map((c) => c.deviceModel)
  const batches = clean.map((c) => c.batch)
  const retailers = clean.map((c) => c.expectedRetailer)

  const inserted = (await sql`
    INSERT INTO imei_registry (
      campaign_id, imei, device_model, batch_code, source, import_batch_id, expected_retailer
    )
    SELECT ${campaign.id}, v.imei, v.model, v.batch, 'Import'::imei_source, ${batchId}, v.retailer
    FROM UNNEST(
      ${imeis}::text[],
      ${models}::text[],
      ${batches}::text[],
      ${retailers}::text[]
    ) AS v(imei, model, batch, retailer)
    ON CONFLICT (campaign_id, imei) DO NOTHING
    RETURNING id
  `) as { id: string }[]

  const importedCount = inserted.length
  const duplicatesCount = clean.length - importedCount
  const failedCount = missing + invalid

  await sql`
    UPDATE import_batches SET
      imported = ${importedCount},
      duplicates = ${duplicatesCount},
      failed = ${failedCount}
    WHERE id = ${batchId}
  `

  await logAdminAction({
    action: "imei.import",
    summary: `Imported ${importedCount.toLocaleString()} IMEIs from ${fileName} (${duplicatesCount} duplicates, ${failedCount} invalid)`,
    campaignId: campaign.id,
    entityType: "import_batch",
    entityId: batchId,
    details: {
      fileName,
      imported: importedCount,
      duplicates: duplicatesCount,
      failed: failedCount,
    },
  })

  revalidatePath("/admin/dashboard/imei-registry")

  return {
    ok: true,
    imported: importedCount,
    duplicates: duplicatesCount,
    failed: failedCount,
  }
}
