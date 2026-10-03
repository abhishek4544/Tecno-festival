import { AddImeiSheet } from "@/components/dashboard/add-imei-sheet"
import { ImportImeiSheet } from "@/components/dashboard/import-imei-sheet"
import { PageHeader } from "@/components/dashboard/page-header"
import { listImeisPage } from "@/lib/db-queries"
import {
  firstParam,
  parseOption,
  parsePage,
  parsePageSize,
} from "@/lib/pagination"
import type { ImeiRegistryStatus } from "@/lib/types"
import { ImeiTable } from "./imei-table"

const STATUSES: ImeiRegistryStatus[] = [
  "Unused",
  "Winning Pending",
  "Claimed",
  "Used",
  "Rejected",
  "Blocked",
]
const PRIZES = ["none", "SilverCoin", "SilverKite"] as const

export default async function Page({
  searchParams,
}: PageProps<"/admin/dashboard/imei-registry">) {
  const params = await searchParams
  const filters = {
    query: firstParam(params.q) ?? "",
    status: parseOption(params.status, STATUSES),
    prize: parseOption(params.prize, PRIZES),
  }
  // searchParams makes this page render per request, so the registry is live.
  const result = await listImeisPage({
    ...filters,
    page: parsePage(params.page),
    pageSize: parsePageSize(params.size),
  })

  return (
    <>
      <PageHeader
        title="IMEI Registry"
        description="Eligible devices for the campaign."
        actions={
          <>
            <ImportImeiSheet />
            <AddImeiSheet />
          </>
        }
      />

      <div className="flex flex-col gap-4 p-4 md:p-6">
        {!result.campaignId ? (
          <div className="rounded border bg-card p-6 text-sm text-muted-foreground">
            No active campaign. Set one up in Campaign Settings first.
          </div>
        ) : (
          <ImeiTable
            rows={result.rows}
            total={result.total}
            totalAll={result.totalAll}
            page={result.page}
            pageSize={result.pageSize}
            query={filters.query}
            statusFilter={filters.status ?? "all"}
            prizeFilter={filters.prize ?? "all"}
          />
        )}
      </div>
    </>
  )
}
