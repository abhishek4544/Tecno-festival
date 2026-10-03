import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  type LucideIcon,
  ScanLineIcon,
  SmartphoneIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"

type Kpi = {
  label: string
  value: string
  delta: string
  trend: "up" | "down"
  footerPrimary: string
  footerSecondary: string
  icon: LucideIcon
  /** Reference to --chart-N for accent tinting. */
  accent: 1 | 2 | 3 | 4 | 5
}

const kpis: Kpi[] = [
  {
    label: "Campaign Visits",
    value: "28,412",
    delta: "+12.5%",
    trend: "up",
    footerPrimary: "Trending up this week",
    footerSecondary: "Across all QR entry points",
    icon: ScanLineIcon,
    accent: 1,
  },
  {
    label: "Form Submissions",
    value: "14,208",
    delta: "+8.2%",
    trend: "up",
    footerPrimary: "50.0% visit-to-form conversion",
    footerSecondary: "Form completion is healthy",
    icon: UsersIcon,
    accent: 2,
  },
  {
    label: "Valid IMEIs",
    value: "11,730",
    delta: "+6.1%",
    trend: "up",
    footerPrimary: "82.6% validation success",
    footerSecondary: "Failed attempts logged separately",
    icon: SmartphoneIcon,
    accent: 3,
  },
  {
    label: "Instant Winners",
    value: "2,186",
    delta: "-3.4%",
    trend: "down",
    footerPrimary: "Silver Kite + Silver Coin",
    footerSecondary: "Inventory within budget",
    icon: SparklesIcon,
    accent: 5,
  },
]

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const TrendIcon = kpi.trend === "up" ? ArrowUpRightIcon : ArrowDownRightIcon
        const accentVar = `var(--chart-${kpi.accent})`
        return (
          <Card
            key={kpi.label}
            className="@container/card relative overflow-hidden bg-card shadow-xs"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentVar} 50%, transparent)`,
                opacity: 0.6,
              }}
            />
            <CardHeader>
              <CardDescription className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <span
                  className="flex size-6 items-center justify-center rounded-[3px]"
                  style={{
                    background: `color-mix(in oklch, ${accentVar} 14%, transparent)`,
                    color: accentVar,
                  }}
                >
                  <Icon className="size-3.5" strokeWidth={2} />
                </span>
                {kpi.label}
              </CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight @[220px]/card:text-4xl">
                {kpi.value}
              </CardTitle>
              <CardAction>
                <Badge
                  variant="outline"
                  className="gap-1 rounded-sm border-transparent font-medium tabular-nums"
                  style={{
                    background: `color-mix(in oklch, ${accentVar} 10%, transparent)`,
                    color: accentVar,
                  }}
                >
                  <TrendIcon className="size-3" />
                  {kpi.delta}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 pt-0 text-sm">
              <div className="font-medium">{kpi.footerPrimary}</div>
              <div className="text-xs text-muted-foreground">
                {kpi.footerSecondary}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
