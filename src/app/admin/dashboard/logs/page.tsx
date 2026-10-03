import { PageHeader } from "@/components/dashboard/page-header"
import { AUDIT_ACTIONS, type AuditAction } from "@/lib/audit-log"
import { AUDIT_LOG_GROUPS, listAuditLogsPage } from "@/lib/db-queries"
import { parseOption, parsePage, parsePageSize } from "@/lib/pagination"
import { LogsTable } from "./logs-table"

export default async function Page({
  searchParams,
}: PageProps<"/admin/dashboard/logs">) {
  const params = await searchParams
  const group = parseOption(params.type, AUDIT_LOG_GROUPS)
  // searchParams makes this page render per request, so new activity shows up straight away.
  const result = await listAuditLogsPage({
    group,
    page: parsePage(params.page),
    pageSize: parsePageSize(params.size),
  })

  const rows = result.rows.map((row) => ({
    ...row,
    label: AUDIT_ACTIONS[row.action as AuditAction] ?? row.action,
  }))

  return (
    <>
      <PageHeader
        title="Activity Logs"
        description="Every change made from the admin panel, newest first."
      />

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <LogsTable
          rows={rows}
          total={result.total}
          totalAll={result.totalAll}
          page={result.page}
          pageSize={result.pageSize}
          typeFilter={group ?? "all"}
        />
      </div>
    </>
  )
}
