import Link from "next/link"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  RotateCcwIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"
import type { ComponentType, SVGProps } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { mockParticipants } from "@/lib/mock-participants"

type Accent = 1 | 2 | 3 | 5

type Kpi = {
  label: string
  value: string
  footer: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  accent: Accent
  href?: string
}

// --- mock prize inventory, aligned with /scratch-rewards ---
const silverKite = { total: 50, distributed: 7 }
const silverCoin = { total: 500, distributed: 42 }

export default function Page() {
  const total = mockParticipants.length
  const pending = mockParticipants.filter((p) => p.verification === "Pending").length
  const confirmed = mockParticipants.filter((p) => p.verification === "Confirmed").length
  const tryAgain = mockParticipants.filter((p) => p.scratch === "Try Again").length
  const scratchWins = silverKite.distributed + silverCoin.distributed
  const remainingSK = silverKite.total - silverKite.distributed
  const remainingSC = silverCoin.total - silverCoin.distributed

  const kpis: Kpi[] = [
    {
      label: "Participants",
      value: total.toLocaleString(),
      footer: "Form submissions this campaign",
      icon: UsersIcon,
      accent: 2,
    },
    {
      label: "Pending verification",
      value: pending.toLocaleString(),
      footer: pending > 0 ? "Awaiting admin action" : "All caught up",
      icon: ClockIcon,
      accent: 1,
      href: "/admin/dashboard/participants",
    },
    {
      label: "Confirmed winners",
      value: confirmed.toLocaleString(),
      footer: "Verified Silver Kite + Silver Coin",
      icon: CheckCircle2Icon,
      accent: 3,
    },
    {
      label: "Instant wins issued",
      value: scratchWins.toLocaleString(),
      footer: `${remainingSK + remainingSC} prizes left in stock`,
      icon: SparklesIcon,
      accent: 5,
    },
  ]

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 py-4 md:py-6">
      <section className="grid grid-cols-1 gap-3 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="px-4 lg:px-6">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Random gift outcomes
              </span>
              <Button
                size="xs"
                variant="ghost"
                render={<Link href="/admin/dashboard/scratch-rewards" />}
              >
                Manage
                <ArrowRightIcon />
              </Button>
            </div>

            <RewardBar
              label="Silver Kite"
              tone="var(--chart-5)"
              total={silverKite.total}
              distributed={silverKite.distributed}
            />
            <RewardBar
              label="Silver Coin"
              tone="var(--chart-2)"
              total={silverCoin.total}
              distributed={silverCoin.distributed}
            />
            <TryAgainRow count={tryAgain} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function KpiCard({ label, value, footer, icon: Icon, accent, href }: Kpi) {
  const accentVar = `var(--chart-${accent})`
  const body = (
    <Card className="@container/card relative overflow-hidden bg-card shadow-xs transition-colors hover:bg-muted/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentVar} 50%, transparent)`,
          opacity: 0.6,
        }}
      />
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <span
              className="flex size-6 items-center justify-center rounded-[3px]"
              style={{
                background: `color-mix(in oklch, ${accentVar} 14%, transparent)`,
                color: accentVar,
              }}
            >
              <Icon className="size-3.5" />
            </span>
            {label}
          </span>
          {href ? <ArrowRightIcon className="size-3.5 text-muted-foreground" /> : null}
        </div>
        <div className="text-3xl font-semibold tabular-nums tracking-tight @[220px]/card:text-4xl">
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{footer}</div>
      </CardContent>
    </Card>
  )
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}

function RewardBar({
  label,
  tone,
  total,
  distributed,
}: {
  label: string
  tone: string
  total: number
  distributed: number
}) {
  const pct = total > 0 ? Math.round((distributed / total) * 100) : 0
  const remaining = total - distributed
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ background: tone }}
          />
          {label}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">{distributed}</span>
          {" / "}
          {total.toLocaleString()}
          <span className="ml-2">({remaining.toLocaleString()} left)</span>
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: tone }}
        />
      </div>
    </div>
  )
}

function TryAgainRow({ count }: { count: number }) {
  const tone = "var(--muted-foreground)"
  return (
    <div className="flex items-center justify-between gap-2 border-t pt-4">
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        <span
          aria-hidden
          className="flex size-5 items-center justify-center rounded-full"
          style={{ color: tone, background: `color-mix(in oklch, ${tone} 14%, transparent)` }}
        >
          <RotateCcwIcon className="size-3" />
        </span>
        Try Again
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        <span className="font-medium text-foreground">{count}</span>
        <span className="ml-2">no-prize scratches</span>
      </span>
    </div>
  )
}
