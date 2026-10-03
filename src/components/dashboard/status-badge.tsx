import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import type { ImeiRegistryStatus, ScratchOutcome, VerificationStatus } from "@/lib/types"

const imeiTone: Record<ImeiRegistryStatus, string> = {
  Unused: "var(--chart-1)",
  Used: "var(--muted-foreground)",
  "Winning Pending": "var(--chart-2)",
  Claimed: "var(--chart-3)",
  Rejected: "var(--chart-4)",
  Blocked: "var(--chart-4)",
}

const scratchTone: Record<ScratchOutcome, string> = {
  "Silver Kite": "var(--chart-5)",
  "Silver Coin": "var(--chart-2)",
  "Try Again": "var(--muted-foreground)",
  Pending: "var(--muted-foreground)",
}

const verificationTone: Record<VerificationStatus, string> = {
  Pending: "var(--chart-1)",
  Confirmed: "var(--chart-3)",
  Rejected: "var(--chart-4)",
}

function Pill({
  color,
  label,
  className,
}: {
  color: string
  label: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-sm border-transparent font-medium", className)}
      style={{
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        color,
      }}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </Badge>
  )
}

export function ImeiStatusBadge({
  status,
  className,
}: {
  status: ImeiRegistryStatus
  className?: string
}) {
  return <Pill color={imeiTone[status]} label={status} className={className} />
}

export function ScratchBadge({
  outcome,
  className,
}: {
  outcome: ScratchOutcome
  className?: string
}) {
  return (
    <Pill
      color={scratchTone[outcome]}
      label={outcome === "Pending" ? "Unused" : outcome}
      className={className}
    />
  )
}

export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus
  className?: string
}) {
  return <Pill color={verificationTone[status]} label={status} className={className} />
}
