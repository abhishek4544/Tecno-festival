import { PageHeader } from "@/components/dashboard/page-header"
import { listParticipantsPage } from "@/lib/db-queries"
import {
  firstParam,
  parseOption,
  parsePage,
  parsePageSize,
} from "@/lib/pagination"
import type { ScratchOutcomeDb, VerificationStatus } from "@/lib/types"
import { ParticipantsTable } from "./participants-table"

const VERIFICATIONS: Array<VerificationStatus | "none"> = [
  "Pending",
  "Confirmed",
  "Rejected",
  "none",
]
const SCRATCH_OUTCOMES: ScratchOutcomeDb[] = [
  "SilverKite",
  "SilverCoin",
  "TryAgain",
  "Pending",
]

export default async function Page({
  searchParams,
}: PageProps<"/admin/dashboard/participants">) {
  const params = await searchParams
  const filters = {
    query: firstParam(params.q) ?? "",
    verification: parseOption(params.status, VERIFICATIONS),
    scratch: parseOption(params.prize, SCRATCH_OUTCOMES),
  }
  // searchParams makes this page render per request, so new entries show up straight away.
  const result = await listParticipantsPage({
    ...filters,
    page: parsePage(params.page),
    pageSize: parsePageSize(params.size),
  })

  return (
    <>
      <PageHeader
        title="Participants"
        description="Customers who submitted the campaign form."
      />

      <div className="flex flex-col gap-4 p-4 md:p-6">
        {!result.campaignId ? (
          <div className="rounded border bg-card p-6 text-sm text-muted-foreground">
            No active campaign. Set one up in Campaign Settings first.
          </div>
        ) : (
          <ParticipantsTable
            rows={result.rows}
            total={result.total}
            totalAll={result.totalAll}
            page={result.page}
            pageSize={result.pageSize}
            query={filters.query}
            statusFilter={filters.verification ?? "all"}
            prizeFilter={filters.scratch ?? "all"}
          />
        )}
      </div>
    </>
  )
}
