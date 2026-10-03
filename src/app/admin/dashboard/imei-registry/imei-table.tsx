"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CheckIcon,
  ChevronDownIcon,
  GiftIcon,
  ShuffleIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"

import { setPrize } from "@/app/admin/dashboard/imei-registry/actions"
import { PrizeBadge } from "@/components/dashboard/prize-badge"
import { ImeiStatusBadge } from "@/components/dashboard/status-badge"
import { TablePagination } from "@/components/dashboard/table-pagination"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { cn } from "@/lib/utils"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import type { AssignedPrize, ImeiRecord, ImeiRegistryStatus } from "@/lib/types"

/** Prizes assignable from the IMEI Registry. Gold Kite is NOT here — it's
 *  decided later from the pool of valid entries, not pre-marked. */
type AssignablePrize = Extract<AssignedPrize, "SilverCoin" | "SilverKite"> | null

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const PRIZE_OPTIONS: Array<{
  value: AssignablePrize
  label: string
  Icon: React.ComponentType<{ className?: string }>
}> = [
  { value: null, label: "Random Gift", Icon: ShuffleIcon },
  { value: "SilverCoin", label: "Silver Coin", Icon: GiftIcon },
  { value: "SilverKite", label: "Silver Kite", Icon: SparklesIcon },
]

type StatusFilter = ImeiRegistryStatus | "all"
type PrizeFilter = "all" | "none" | "SilverCoin" | "SilverKite"

const PRIZE_FILTER_LABELS: Record<PrizeFilter, string> = {
  all: "All",
  none: "Random Gift",
  SilverCoin: "Silver Coin",
  SilverKite: "Silver Kite",
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

type ImeiTableProps = {
  /** The current page of rows; filtering and paging happen on the server. */
  rows: ImeiRecord[]
  total: number
  totalAll: number
  page: number
  pageSize: number
  query: string
  statusFilter: StatusFilter
  prizeFilter: PrizeFilter
}

export function ImeiTable({
  rows,
  total,
  totalAll,
  page,
  pageSize,
  query,
  statusFilter,
  prizeFilter,
}: ImeiTableProps) {
  const router = useRouter()
  const { navigate, isPending } = useSearchParamsNavigation()
  const [search, setSearch] = React.useState(query)
  const searchTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const [busyId, setBusyId] = React.useState<string | null>(null)

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

  function requestPrizeChange(row: ImeiRecord, prize: AssignablePrize) {
    if (prize === row.assignedPrize) return
    void applyPrize(row.id, prize)
  }

  async function applyPrize(id: string, prize: AssignablePrize) {
    setBusyId(id)
    try {
      await setPrize(id, prize)
      router.refresh()
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
            placeholder="Search IMEI…"
            className="h-8 pl-8"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) =>
            navigate({ status: v === "all" ? null : v, page: null })
          }
        >
          <SelectTrigger size="sm" className="w-[230px]">
            <FilterLabel
              name="Status"
              value={statusFilter === "all" ? "All" : statusFilter}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Unused">Unused</SelectItem>
            <SelectItem value="Winning Pending">Winning Pending</SelectItem>
            <SelectItem value="Claimed">Claimed</SelectItem>
            <SelectItem value="Used">Used</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={prizeFilter}
          onValueChange={(v) =>
            navigate({ prize: v === "all" ? null : v, page: null })
          }
        >
          <SelectTrigger size="sm" className="w-[180px]">
            <FilterLabel name="Prize" value={PRIZE_FILTER_LABELS[prizeFilter]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All prizes</SelectItem>
            <SelectItem value="none">Random Gift</SelectItem>
            <SelectItem value="SilverCoin">Silver Coin</SelectItem>
            <SelectItem value="SilverKite">Silver Kite</SelectItem>
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

      <div
        aria-busy={isPending}
        className={cn(
          "overflow-hidden rounded border bg-card transition-opacity",
          isPending && "opacity-60",
        )}
      >
        <Table className="min-w-[700px] table-fixed">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="pl-4">IMEI</TableHead>
              <TableHead className="w-[200px] text-right">Status</TableHead>
              <TableHead className="w-[180px] text-right">Prize</TableHead>
              <TableHead className="w-[130px] pr-4 text-right">Added</TableHead>
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
                    ? "No IMEIs yet. Add one or import a batch."
                    : "No matches."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const isBusy = busyId === r.id
                return (
                  <TableRow key={r.id} className="group/row">
                    <TableCell className="pl-4 font-mono text-[13px] tabular-nums">
                      {r.imei}
                    </TableCell>
                    <TableCell className="text-right">
                      <ImeiStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <PrizeCell
                        row={r}
                        isBusy={isBusy}
                        onPick={(prize) => requestPrizeChange(r, prize)}
                      />
                    </TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground">
                      {dateFmt.format(new Date(r.addedAt))}
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

function PrizeCell({
  row,
  isBusy,
  onPick,
}: {
  row: ImeiRecord
  isBusy: boolean
  onPick: (prize: AssignablePrize) => void
}) {
  return (
    <DropdownMenu>
      <div className="inline-flex items-center gap-2">
        <PrizeBadge prize={row.assignedPrize} />
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              aria-label="Change prize"
              disabled={isBusy}
              className="opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
            />
          }
        >
          <ChevronDownIcon />
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="start" className="w-44">
        {PRIZE_OPTIONS.map((opt) => {
          const Icon = opt.Icon
          const active = row.assignedPrize === opt.value
          return (
            <DropdownMenuItem
              key={opt.value ?? "none"}
              onClick={() => onPick(opt.value)}
            >
              <Icon />
              <span>{opt.label}</span>
              {active ? <CheckIcon className="ml-auto size-3.5" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

