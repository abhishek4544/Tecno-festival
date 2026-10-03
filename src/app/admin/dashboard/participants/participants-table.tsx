"use client"

import * as React from "react"
import { SearchIcon, CheckIcon, XIcon } from "lucide-react"

import {
  ScratchBadge,
  VerificationBadge,
} from "@/components/dashboard/status-badge"
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
import type { ParticipantRow, ScratchOutcome, VerificationStatus } from "@/lib/types"

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
type PrizeFilter = "all" | ScratchOutcome

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  Pending: "Pending",
  Confirmed: "Confirmed",
  Rejected: "Rejected",
  none: "No win",
}

const PRIZE_LABELS: Record<PrizeFilter, string> = {
  all: "All",
  "Silver Kite": "Silver Kite",
  "Silver Coin": "Silver Coin",
  "Try Again": "Try Again",
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

export function ParticipantsTable({ rows }: { rows: ParticipantRow[] }) {
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [prizeFilter, setPrizeFilter] = React.useState<PrizeFilter>("all")
  const [data, setData] = React.useState(rows)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.filter((p) => {
      if (statusFilter !== "all") {
        if (statusFilter === "none") {
          if (p.verification !== null) return false
        } else if (p.verification !== statusFilter) {
          return false
        }
      }
      if (prizeFilter !== "all" && p.scratch !== prizeFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        p.imei.includes(q) ||
        p.retailerEntered.toLowerCase().includes(q)
      )
    })
  }, [data, query, statusFilter, prizeFilter])

  const hasActiveFilter =
    query !== "" || statusFilter !== "all" || prizeFilter !== "all"

  function clearFilters() {
    setQuery("")
    setStatusFilter("all")
    setPrizeFilter("all")
  }

  function resolve(id: string, status: "Confirmed" | "Rejected") {
    setData((prev) =>
      prev.map((p) => (p.id === id ? { ...p, verification: status } : p)),
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, mobile, IMEI, retailer…"
            className="h-8 pl-8"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
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
          onValueChange={(v) => setPrizeFilter(v as PrizeFilter)}
        >
          <SelectTrigger size="sm" className="w-[180px]">
            <FilterLabel name="Prize" value={PRIZE_LABELS[prizeFilter]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All prizes</SelectItem>
            <SelectItem value="Silver Kite">Silver Kite</SelectItem>
            <SelectItem value="Silver Coin">Silver Coin</SelectItem>
            <SelectItem value="Try Again">Try Again</SelectItem>
            <SelectItem value="Pending">Not scratched</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilter ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        ) : null}

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length.toLocaleString()} of {data.length.toLocaleString()}
        </span>
      </div>

      <div className="overflow-hidden rounded border bg-card">
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {data.length === 0
                    ? "No participants yet."
                    : hasActiveFilter
                      ? "No matches for the active filter."
                      : "No matches."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const canAct =
                  isWin(p.scratch) && p.verification === "Pending"
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
                            onClick={() => resolve(p.id, "Confirmed")}
                          >
                            <CheckIcon />
                            Pass
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => resolve(p.id, "Rejected")}
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
    </>
  )
}
