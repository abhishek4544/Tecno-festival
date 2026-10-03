import { TrophyIcon, UsersIcon } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { mockParticipants } from "@/lib/mock-participants"

const gold = "var(--chart-2)"

export default function Page() {
  // Pool of valid entries: every participant with a non-rejected verification.
  // Rejected scratch wins AND non-wins both stay in the Gold Kite pool.
  const eligible = mockParticipants.filter(
    (p) => p.verification !== "Rejected",
  ).length

  return (
    <>
      <PageHeader
        title="Gold Kite Draw"
        description="The Gold Kite is drawn at campaign close from all valid entries."
      />

      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Card className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${gold} 50%, transparent)`,
              opacity: 0.7,
            }}
          />
          <CardContent className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-sm"
                style={{
                  background: `color-mix(in oklch, ${gold} 14%, transparent)`,
                  color: gold,
                }}
              >
                <TrophyIcon className="size-4" />
              </span>
              <Badge
                variant="outline"
                className="gap-1.5 rounded-sm border-transparent font-medium"
                style={{
                  background: `color-mix(in oklch, ${gold} 12%, transparent)`,
                  color: gold,
                }}
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ background: gold }}
                />
                Awaiting draw
              </Badge>
            </div>

            <div className="flex items-end gap-3">
              <span className="text-5xl font-semibold tabular-nums tracking-tight md:text-6xl">
                {eligible.toLocaleString()}
              </span>
              <span className="pb-2 text-sm text-muted-foreground">
                eligible entries
              </span>
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <UsersIcon className="mt-0.5 size-3.5 shrink-0" />
              <p>
                The winner will be selected from this pool when the campaign
                closes. Every participant with a valid, non-rejected entry
                stays eligible — including scratch-card "Try Again" entries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
