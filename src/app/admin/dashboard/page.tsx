import Link from "next/link"
import { connection } from "next/server"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  CoinsIcon,
  SparklesIcon,
  UsersIcon,
  WindIcon,
} from "lucide-react"
import type { ComponentType, SVGProps } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { getOverviewStats } from "@/lib/db-queries"
import { resolveSilverCoinCap, sortTiers } from "@/lib/silver-coin-tiers"

type Accent = 1 | 2 | 3 | 5

type Kpi = {
  label: string
  value: string
  footer: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  accent: Accent
  href?: string
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export default async function Page() {
  // Render per request so the numbers are always live.
  await connection()
  const stats = await getOverviewStats()

  if (!stats.campaign) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="rounded border bg-card p-6 text-sm text-muted-foreground">
          No active campaign. Set one up in Campaign Settings first.
        </div>
      </div>
    )
  }

  const { silverKite, silverCoin, silverCoinTiers, silverKitePerWeek } = stats
  const prizesGiven = silverKite.distributed + silverCoin.distributed
  const prizesLeft =
    silverKite.total - silverKite.distributed +
    (silverCoin.total - silverCoin.distributed)

  // Resolve the cap for the current sales count directly from the live tier
  // config — this is the same algorithm used by claim_entry server-side.
  const coinsUnlocked = resolveSilverCoinCap(
    silverCoinTiers,
    stats.participantsToday,
  )
  const sortedTiers = sortTiers(silverCoinTiers)
  const nextTier = sortedTiers.find(
    (t) => t.upTo !== null && stats.participantsToday <= t.upTo && t.coins > coinsUnlocked,
  )

  const kpis: Kpi[] = [
    {
      label: "Participants",
      value: stats.participants.toLocaleString(),
      footer: `${stats.participantsToday.toLocaleString()} today`,
      icon: UsersIcon,
      accent: 2,
      href: "/admin/dashboard/participants",
    },
    {
      label: "Pending verification",
      value: stats.pending.toLocaleString(),
      footer: stats.pending > 0 ? "Awaiting admin action" : "All caught up",
      icon: ClockIcon,
      accent: 1,
      href: "/admin/dashboard/participants?status=Pending",
    },
    {
      label: "Confirmed winners",
      value: stats.confirmed.toLocaleString(),
      footer: "Verified Silver Kite + Silver Coin",
      icon: CheckCircle2Icon,
      accent: 3,
    },
    {
      label: "Prizes given",
      value: prizesGiven.toLocaleString(),
      footer: `${prizesLeft.toLocaleString()} prizes left in stock`,
      icon: SparklesIcon,
      accent: 5,
    },
  ]

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 py-4 md:py-6">
      <section className="flex flex-wrap items-baseline justify-between gap-2 px-4 lg:px-6">
        <h2 className="text-sm font-medium">{stats.campaign.name}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {dateFmt.format(new Date(stats.campaign.startAt))} –{" "}
          {dateFmt.format(new Date(stats.campaign.endAt))}
        </span>
      </section>

      <section className="grid grid-cols-1 gap-3 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="px-4 lg:px-6">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Today&apos;s draw
            </span>

            <DrawRow
              icon={CoinsIcon}
              tone="var(--chart-2)"
              label="Silver Coins today"
              given={stats.coinsToday}
              limit={coinsUnlocked}
              note={
                nextTier
                  ? `${stats.participantsToday.toLocaleString()} sales today · limit rises to ${nextTier.coins} after ${nextTier.upTo} sales`
                  : `${stats.participantsToday.toLocaleString()} sales today · daily maximum reached`
              }
            />
            <DrawRow
              icon={WindIcon}
              tone="var(--chart-5)"
              label="Silver Kites this week"
              given={stats.kitesThisWeek}
              limit={silverKitePerWeek}
              note={`${silverKitePerWeek} random ${
                silverKitePerWeek === 1 ? "moment" : "moments"
              } each campaign week`}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function DrawRow({
  icon: Icon,
  tone,
  label,
  given,
  limit,
  note,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: string
  label: string
  given: number
  limit: number
  note: string
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((given / limit) * 100)) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Icon className="size-3.5" style={{ color: tone }} />
          {label}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">{given}</span>
          {" / "}
          {limit}
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: tone }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{note}</span>
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
