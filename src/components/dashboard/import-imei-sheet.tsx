"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CloudUploadIcon,
  DownloadIcon,
  FileTextIcon,
} from "lucide-react"

import {
  commitImeiImport,
  previewImeiImport,
  type ImportIssue,
  type ImportPreview,
  type ImportRow,
} from "@/app/admin/dashboard/imei-registry/actions"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type Stage =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "preview"; preview: ImportPreview; rows: ImportRow[]; fileName: string }
  | { kind: "committing"; preview: ImportPreview; rows: ImportRow[]; fileName: string }
  | { kind: "done"; imported: number; duplicates: number; failed: number }
  | { kind: "error"; message: string }

const RETAILER_SHEET_CANDIDATES = ["retalers", "retailers", "retailer"]

function downloadTemplate() {
  const data = [
    ["Brand", "Item", "Model", "Market Name", "SP/FP", "Series", "Color", "Memory", "IMEI", "Buyer Name", "Buyer Type"],
    ["TECNO", "KL5 128+6", "KL5", "TECNO SPARK 30C", "Smart", "SPARK", "ORBIT BLACK", "128+6", "350521670588384", "HOME MOBILE HUB", "Retailer"],
    ["TECNO", "KN3 64+3", "KN3", "TECNO SPARK Go 3", "Smart", "SPARK", "GRAVITY BLACK", "64+3", "359600480628266", "MAHALAXMI MOBILES PRIVATE LIMITED", "Retailer"],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Retalers")
  XLSX.writeFile(wb, "imei-import-template.xlsx")
}

function normalizeHeader(s: unknown): string {
  return String(s ?? "").trim().toLowerCase()
}

function findHeaderIndex(header: string[], aliases: string[]): number {
  return header.findIndex((h) => aliases.includes(normalizeHeader(h)))
}

/**
 * Parse the TECNO XLSX workbook. We pick the Retalers sheet (any spelling) —
 * that's the only sheet where IMEI is attributed to the shop that sold it,
 * which is what verification compares against.
 */
function parseWorkbook(file: ArrayBuffer): { rows: ImportRow[]; sheetName: string } | { error: string } {
  const wb = XLSX.read(file, { type: "array" })

  const sheetName =
    wb.SheetNames.find((n) =>
      RETAILER_SHEET_CANDIDATES.includes(normalizeHeader(n)),
    ) ?? null

  if (!sheetName) {
    return {
      error: `Could not find a "Retalers" (or "Retailers") sheet. Workbook has: ${wb.SheetNames.join(", ")}.`,
    }
  }

  const ws = wb.Sheets[sheetName]
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false })
  if (grid.length < 2) return { error: "Sheet is empty." }

  const header = (grid[0] as unknown[]).map(normalizeHeader)
  const iImei = findHeaderIndex(header, ["imei"])
  const iMarket = findHeaderIndex(header, ["market name", "device_model", "model name"])
  const iModel = findHeaderIndex(header, ["model", "model code"])
  const iBuyer = findHeaderIndex(header, ["buyer name", "retailer", "retailer name"])

  if (iImei < 0) {
    return { error: "Missing required column (IMEI)." }
  }

  const rows: ImportRow[] = []
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r] as unknown[]
    const imei = String(row[iImei] ?? "").trim()
    if (!imei) continue
    rows.push({
      imei,
      deviceModel: String(row[iMarket] ?? "").trim(),
      batch: iModel >= 0 ? String(row[iModel] ?? "").trim() || null : null,
      expectedRetailer: iBuyer >= 0 ? String(row[iBuyer] ?? "").trim() || null : null,
    })
  }

  return { rows, sheetName }
}

export function ImportImeiSheet() {
  const [open, setOpen] = React.useState(false)
  const [stage, setStage] = React.useState<Stage>({ kind: "idle" })

  function reset() {
    setStage({ kind: "idle" })
  }

  async function onFile(file: File) {
    setStage({ kind: "parsing" })
    try {
      const buf = await file.arrayBuffer()
      const parsed = parseWorkbook(buf)
      if ("error" in parsed) {
        setStage({ kind: "error", message: parsed.error })
        return
      }
      if (parsed.rows.length === 0) {
        setStage({ kind: "error", message: "No IMEI rows found in the Retalers sheet." })
        return
      }
      const result = await previewImeiImport(parsed.rows)
      if (!result.ok) {
        setStage({ kind: "error", message: result.message })
        return
      }
      setStage({ kind: "preview", preview: result.preview, rows: parsed.rows, fileName: file.name })
    } catch {
      setStage({ kind: "error", message: "Could not read file." })
    }
  }

  async function onCommit() {
    if (stage.kind !== "preview") return
    const { preview, rows, fileName } = stage
    setStage({ kind: "committing", preview, rows, fileName })
    const result = await commitImeiImport(rows, fileName)
    if (!result.ok) {
      setStage({ kind: "error", message: result.message })
      return
    }
    setStage({
      kind: "done",
      imported: result.imported,
      duplicates: result.duplicates,
      failed: result.failed,
    })
  }

  React.useEffect(() => {
    if (!open) reset()
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <CloudUploadIcon />
            Import
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Bulk import IMEIs</SheetTitle>
          <SheetDescription>
            TECNO XLSX. Reads the <code className="font-mono">Retalers</code> sheet.
            Columns used: <code className="font-mono">IMEI</code>,{" "}
            <code className="font-mono">Market Name</code>,{" "}
            <code className="font-mono">Model</code>,{" "}
            <code className="font-mono">Buyer Name</code>.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4">
          {stage.kind === "idle" ? <FileDrop onFile={onFile} /> : null}

          {stage.kind === "parsing" ? <Hint>Parsing and validating…</Hint> : null}

          {stage.kind === "preview" || stage.kind === "committing" ? (
            <PreviewView
              preview={stage.preview}
              fileName={stage.fileName}
              committing={stage.kind === "committing"}
            />
          ) : null}

          {stage.kind === "done" ? (
            <DoneView
              imported={stage.imported}
              duplicates={stage.duplicates}
              failed={stage.failed}
            />
          ) : null}

          {stage.kind === "error" ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertTriangleIcon className="mt-0.5 size-4" />
              <span>{stage.message}</span>
            </div>
          ) : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t">
          {stage.kind === "preview" ? (
            <>
              <Button variant="ghost" size="sm" onClick={reset}>
                Choose another file
              </Button>
              <Button
                size="sm"
                disabled={stage.preview.valid === 0}
                onClick={onCommit}
              >
                Import {stage.preview.valid.toLocaleString()} valid
              </Button>
            </>
          ) : stage.kind === "done" || stage.kind === "error" ? (
            <SheetClose render={<Button variant="ghost" size="sm" />}>
              Close
            </SheetClose>
          ) : (
            <SheetClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </SheetClose>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FileDrop({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="imei-xlsx-input"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-input bg-muted/30 px-4 py-10 text-center transition-colors hover:border-ring hover:bg-muted/50"
      >
        <CloudUploadIcon className="size-6 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Choose a TECNO XLSX file</span>
          <span className="text-xs text-muted-foreground">or drop it here</span>
        </div>
        <input
          id="imei-xlsx-input"
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
      </label>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Need the layout? Download a sample.
        </span>
        <Button variant="outline" size="xs" onClick={downloadTemplate}>
          <DownloadIcon />
          Download template
        </Button>
      </div>
    </div>
  )
}

function PreviewView({
  preview,
  fileName,
  committing,
}: {
  preview: ImportPreview
  fileName: string
  committing: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded border bg-muted/30 p-2.5 text-sm">
        <FileTextIcon className="size-4 text-muted-foreground" />
        <span className="truncate">{fileName}</span>
        <span className="ml-auto tabular-nums text-xs text-muted-foreground">
          {preview.total.toLocaleString()} rows
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Ready" value={preview.valid} tone="var(--chart-3)" />
        <Stat label="Duplicates" value={preview.duplicates} tone="var(--chart-1)" />
        <Stat label="Invalid" value={preview.invalid} tone="var(--chart-4)" />
        <Stat label="Missing" value={preview.missing} tone="var(--chart-4)" />
      </div>

      {preview.issues.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Issues (first {preview.issues.length})
          </span>
          <div className="max-h-56 overflow-y-auto rounded border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/60">
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-1.5 font-medium">Row</th>
                  <th className="px-2 py-1.5 font-medium">IMEI</th>
                  <th className="px-2 py-1.5 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {preview.issues.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1 tabular-nums text-muted-foreground">
                      {it.row}
                    </td>
                    <td className="px-2 py-1 font-mono text-[11px]">{it.imei}</td>
                    <td className="px-2 py-1 capitalize text-muted-foreground">
                      {reasonLabel(it.reason)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {committing ? <Hint>Importing…</Hint> : null}
    </div>
  )
}

function DoneView({
  imported,
  duplicates,
  failed,
}: {
  imported: number
  duplicates: number
  failed: number
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border bg-card p-6 text-center">
      <span
        className="flex size-10 items-center justify-center rounded-full"
        style={{
          background: "color-mix(in oklch, var(--chart-3) 14%, transparent)",
          color: "var(--chart-3)",
        }}
      >
        <CheckCircle2Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold tabular-nums">
          {imported.toLocaleString()} imported
        </span>
        <span className="text-xs text-muted-foreground">
          {duplicates.toLocaleString()} duplicate · {failed.toLocaleString()} failed
        </span>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded border p-3">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className="text-xl font-semibold tabular-nums"
        style={{ color: value > 0 ? tone : undefined }}
      >
        {value.toLocaleString()}
      </span>
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border bg-muted/30 p-3 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function reasonLabel(reason: ImportIssue["reason"]) {
  switch (reason) {
    case "missing":
      return "Missing IMEI or model"
    case "invalid":
      return "Not 15 digits"
    case "duplicate":
      return "Duplicate"
  }
}
