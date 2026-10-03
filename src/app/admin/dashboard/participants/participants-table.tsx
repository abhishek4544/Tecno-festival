"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, CheckIcon, XIcon } from "lucide-react"

import {
  failVerification,
  passVerification,
} from "@/app/admin/dashboard/participants/actions"
import {
  ScratchBadge,
  VerificationBadge,
} from "@/components/dashboard/status-badge"
import { TablePagination } from "@/components/dashboard/table-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import type {
  ParticipantRow,
  ScratchOutcomeDb,
  VerificationStatus,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

function isWin(scratch: ParticipantRow["scratch"]) {
  return scratch === "Silver Kite" || scratch === "Silver Coin"
}

type StatusFilter = "all" | VerificationStatus | "none"
type PrizeFilter = "all" | ScratchOutcomeDb

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  Pending: "Pending",
  Confirmed: "Confirmed",
  Rejected: "Rejected",
  none: "No win",
}

const PRIZE_LABELS: Record<PrizeFilter, string> = {
  all: "All",
  SilverKite: "Silver Kite",
  SilverCoin: "Silver Coin",
  TryAgain: "Try Again",
  Pending: "Not scratched",
}

function FilterLabel({ name, value }: { name: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5 truncate">
      <span className="text-muted-foreground">{name}:</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </span>
  )
}

// How long to wait after the last keystroke before searching.
const SEARCH_DEBOUNCE_MS = 300

type ParticipantsTableProps = {
  /** The current page of rows; filtering and paging happen on the server. */
  rows: ParticipantRow[]
  total: number
  totalAll: number
  page: number
  pageSize: number
  query: string
  statusFilter: StatusFilter
  prizeFilter: PrizeFilter
}

export function ParticipantsTable({
  rows,
  total,
  totalAll,
  page,
  pageSize,
  query,
  statusFilter,
  prizeFilter,
}: ParticipantsTableProps) {
  const router = useRouter()
  const { navigate, isPending } = useSearchParamsNavigation()
  const [search, setSearch] = React.useState(query)
  const searchTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const hasActiveFilter =
    query !== "" || statusFilter !== "all" || prizeFilter !== "all"

  function changeSearch(value: string) {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      navigate({ q: value.trim(), page: null })
    }, SEARCH_DEBOUNCE_MS)
  }

  function clearFilters() {
    clearTimeout(searchTimer.current)
    setSearch("")
    navigate({ q: null, status: null, prize: null, page: null })
  }

  function changePage(next: number) {
    navigate({ page: next === 1 ? null : next })
  }

  function changePageSize(size: number) {
    navigate({ size: size === DEFAULT_PAGE_SIZE ? null : size, page: null })
  }

  async function resolve(scratchResultId: string, pass: boolean) {
    setBusyId(scratchResultId)
    setActionError(null)
    try {
      const result = pass
        ? await passVerification(scratchResultId)
        : await failVerification(scratchResultId)
      if (!result.ok) setActionError(result.message ?? "Could not update.")
      router.refresh()
    } catch {
      setActionError("Could not update. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search name, mobile, IMEI, retailer…"
            className="h-8 pl-8"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) =>
            navigate({ status: v === "all" ? null : v, page: null })
          }
        >
          <SelectTrigger size="sm" className="w-[180px]">
            <FilterLabel name="Status" value={STATUS_LABELS[statusFilter]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="none">No win</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={prizeFilter}
          onValueChange={(v) =>
            navigate({ prize: v === "all" ? null : v, page: null })
          }
        >
          <SelectTrigger size="sm" className="w-[180px]">
            <FilterLabel name="Prize" value={PRIZE_LABELS[prizeFilter]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All prizes</SelectItem>
            <SelectItem value="SilverKite">Silver Kite</SelectItem>
            <SelectItem value="SilverCoin">Silver Coin</SelectItem>
            <SelectItem value="TryAgain">Try Again</SelectItem>
            <SelectItem value="Pending">Not scratched</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilter ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        ) : null}

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {total.toLocaleString()} of {totalAll.toLocaleString()}
        </span>
      </div>

      {actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <div
        aria-busy={isPending}
        className={cn(
          "overflow-hidden rounded border bg-card transition-opacity",
          isPending && "opacity-60",
        )}
      >
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>Retailer</TableHead>
              <TableHead>Scratch</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Participated</TableHead>
              <TableHead className="w-[132px] pr-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {totalAll === 0
                    ? "No participants yet."
                    : hasActiveFilter
                      ? "No matches for the active filter."
                      : "No matches."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => {
                const scratchResultId = p.scratchResultId
                const canAct =
                  scratchResultId !== null &&
                  isWin(p.scratch) &&
                  p.verification === "Pending"
                const isBusy = busyId !== null && busyId === scratchResultId
                const retailerMismatch =
                  p.retailerExpected &&
                  p.retailerEntered.toLowerCase() !==
                    p.retailerExpected.toLowerCase()

                return (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4 font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {p.mobile}
                    </TableCell>
                    <TableCell className="font-mono text-[13px] tabular-nums">
                      {p.imei}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span>{p.retailerEntered}</span>
                        {p.retailerAddress ? (
                          <span className="text-[11px]">{p.retailerAddress}</span>
                        ) : null}
                        {retailerMismatch ? (
                          <span className="text-[11px] text-destructive">
                            Expected: {p.retailerExpected}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ScratchBadge outcome={p.scratch} />
                    </TableCell>
                    <TableCell>
                      {p.verification ? (
                        <VerificationBadge status={p.verification} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {dateFmt.format(new Date(p.participatedAt))}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {canAct ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => resolve(scratchResultId, true)}
                          >
                            <CheckIcon />
                            Pass
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => resolve(scratchResultId, false)}
                          >
                            <XIcon />
                            Fail
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 ? (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
        />
      ) : null}
    </>
  )
}
