"use client"

import { TablePagination } from "@/components/dashboard/table-pagination"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSearchParamsNavigation } from "@/hooks/use-search-params-navigation"
import type { AuditLogGroup, AuditLogRow } from "@/lib/db-queries"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import { cn } from "@/lib/utils"

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

type TypeFilter = "all" | AuditLogGroup

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All",
  admin: "Login / logout",
  imei: "IMEI Registry",
  verification: "Verification",
  settings: "Settings",
}

// Actions worth drawing the eye to.
const ALERT_ACTIONS = new Set(["admin.login_failed", "verification.fail"])

type LogsTableProps = {
  rows: Array<AuditLogRow & { label: string }>
  total: number
  totalAll: number
  page: number
  pageSize: number
  typeFilter: TypeFilter
}

export function LogsTable({
  rows,
  total,
  totalAll,
  page,
  pageSize,
  typeFilter,
}: LogsTableProps) {
  const { navigate, isPending } = useSearchParamsNavigation()

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={typeFilter}
          onValueChange={(v) =>
            navigate({ type: v === "all" ? null : v, page: null })
          }
        >
          <SelectTrigger size="sm" className="w-[220px]">
            <span className="flex items-center gap-1.5 truncate">
              <span className="text-muted-foreground">Type:</span>
              <span className="truncate font-medium text-foreground">
                {TYPE_LABELS[typeFilter]}
              </span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            <SelectItem value="imei">IMEI Registry</SelectItem>
            <SelectItem value="verification">Verification</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="admin">Login / logout</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {total.toLocaleString()} of {totalAll.toLocaleString()}
        </span>
      </div>

      <div
        aria-busy={isPending}
        className={cn(
          "overflow-hidden rounded border bg-card transition-opacity",
          isPending && "opacity-60",
        )}
      >
        <Table className="min-w-[760px] table-fixed">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[190px] pl-4">Time</TableHead>
              <TableHead className="w-[170px]">Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[140px] pr-4 text-right">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {totalAll === 0
                    ? "No activity yet. Admin changes will be listed here."
                    : "No activity of this type."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4 text-muted-foreground tabular-nums">
                    {dateFmt.format(new Date(row.createdAt))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ALERT_ACTIONS.has(row.action) ? "destructive" : "outline"
                      }
                    >
                      {row.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal">{row.summary}</TableCell>
                  <TableCell className="pr-4 text-right font-mono text-[12px] text-muted-foreground">
                    {row.ip ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 ? (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(next) => navigate({ page: next === 1 ? null : next })}
          onPageSizeChange={(size) =>
            navigate({
              size: size === DEFAULT_PAGE_SIZE ? null : size,
              page: null,
            })
          }
        />
      ) : null}
    </>
  )
}
