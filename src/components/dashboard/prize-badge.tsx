import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import { GiftIcon, ShuffleIcon, SparklesIcon, TrophyIcon, type LucideIcon } from "lucide-react"
import type { AssignedPrize } from "@/lib/types"

type Config = {
  label: string
  tone: string
  Icon: LucideIcon
}

const config: Record<Exclude<AssignedPrize, null>, Config> = {
  SilverKite: { label: "Silver Kite", tone: "var(--chart-5)", Icon: SparklesIcon },
  SilverCoin: { label: "Silver Coin", tone: "var(--chart-1)", Icon: GiftIcon },
  GoldKite: { label: "Gold Kite", tone: "var(--chart-2)", Icon: TrophyIcon },
}

export function PrizeBadge({
  prize,
  className,
}: {
  prize: AssignedPrize
  className?: string
}) {
  if (prize === null) {
    return (
      <Badge
        variant="outline"
        className={cn("gap-1 rounded-sm border-transparent bg-muted font-medium text-muted-foreground", className)}
      >
        <ShuffleIcon className="size-3" />
        Random Gift
      </Badge>
    )
  }
  const { label, tone, Icon } = config[prize]
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-sm border-transparent font-medium", className)}
      style={{
        background: `color-mix(in oklch, ${tone} 14%, transparent)`,
        color: tone,
      }}
    >
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}
