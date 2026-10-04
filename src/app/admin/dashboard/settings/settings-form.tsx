"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  GiftIcon,
  PackageIcon,
  SparklesIcon,
} from "lucide-react"

import {
  saveCampaignSettings,
  type SaveSettingsState,
} from "@/app/admin/dashboard/settings/actions"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CampaignSettings } from "@/lib/db-queries"
import { sortTiers } from "@/lib/silver-coin-tiers"
import type { CampaignStatus, SilverCoinTier } from "@/lib/types"

const STATUSES: CampaignStatus[] = [
  "Draft",
  "Scheduled",
  "Active",
  "Paused",
  "Completed",
]

const initial: SaveSettingsState = { ok: false }

const DEFAULT_COIN_TIERS: SilverCoinTier[] = [
  { upTo: 100, coins: 2 },
  { upTo: 200, coins: 3 },
  { upTo: null, coins: 4 },
]

export function SettingsForm({ settings }: { settings: CampaignSettings }) {
  const [state, formAction, pending] = useActionState(
    saveCampaignSettings,
    initial,
  )
  const [status, setStatus] = React.useState<CampaignStatus>(settings.status)
  const formRef = React.useRef<HTMLFormElement | null>(null)

  const errs = state.fieldErrors ?? {}
  const justSaved = state.ok

  return (
    <form ref={formRef} action={formAction}>
      <PageHeader
        title="Campaign Settings"
        description={`${settings.name} · ${settings.code}`}
        actions={
          <>
            {justSaved ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--chart-3)" }}
              >
                <CheckCircle2Icon className="size-3.5" />
                Saved
              </span>
            ) : null}
            <Button size="sm" type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4 p-4 md:p-6">
        {state.message ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertTriangleIcon className="mt-0.5 size-4" />
            <span>{state.message}</span>
          </div>
        ) : null}

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Start date" error={errs.startAt}>
                <Input
                  type="date"
                  name="startAt"
                  defaultValue={settings.startAt}
                  className="max-w-[200px]"
                />
              </Field>
              <Field label="End date" error={errs.endAt}>
                <Input
                  type="date"
                  name="endAt"
                  defaultValue={settings.endAt}
                  className="max-w-[200px]"
                />
              </Field>
            </div>

            <Field label="Status">
              <input type="hidden" name="status" value={status} />
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as CampaignStatus)}
              >
                <SelectTrigger className="max-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <PackageIcon className="size-4" />
                Prize stock
              </h2>
              <p className="text-xs text-muted-foreground">
                Total prizes available for the whole campaign. Once stock runs
                out, no more of that prize is awarded, even if the daily or
                weekly draw would allow it. Cannot be lowered below what&apos;s
                already distributed.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <StockField
                label="Silver Coin stock"
                name="silverCoinStock"
                stock={settings.silverCoin}
                error={errs.silverCoinStock}
              />
              <StockField
                label="Silver Kite stock"
                name="silverKiteStock"
                stock={settings.silverKite}
                error={errs.silverKiteStock}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <GiftIcon className="size-4" />
                Silver Coin — daily sales-based cap
              </h2>
              <p className="text-xs text-muted-foreground">
                Daily cap, based on today&apos;s sales (Nepal time). Each tier
                is the total coins that can be won that day, not an extra
                amount — it resets every day. Admins can still pre-assign a
                Silver Coin to a specific IMEI; that award bypasses the cap.
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {settings.silverCoin.distributed.toLocaleString()} coins
                already distributed.
              </p>
            </div>

            <CoinTiers tiers={settings.silverCoinTiers} errors={errs} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <SparklesIcon className="size-4" />
                Silver Kite — per-week count
              </h2>
              <p className="text-xs text-muted-foreground">
                How many Silver Kites get drawn in each weekly window. Winning
                moments are picked at random times inside the week; the kite is
                awarded to the next entry after a winning moment passes.
                Admins can still pre-assign a Silver Kite to a specific IMEI;
                that award is in addition to the weekly draw.
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {settings.silverKite.distributed.toLocaleString()} kites
                already distributed.
              </p>
            </div>

            <Field
              label="Kites per week"
              error={errs.silverKitePerWeek}
            >
              <Input
                type="number"
                name="silverKitePerWeek"
                min={0}
                step={1}
                defaultValue={settings.silverKitePerWeek}
                className="w-[120px] tabular-nums"
              />
            </Field>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : null}
    </div>
  )
}

function StockField({
  label,
  name,
  stock,
  error,
}: {
  label: string
  name: string
  stock: { total: number; distributed: number }
  error?: string
}) {
  return (
    <Field label={label} error={error}>
      <Input
        type="number"
        name={name}
        min={stock.distributed}
        step={1}
        defaultValue={stock.total}
        className="w-[180px] tabular-nums"
      />
      <span className="text-xs text-muted-foreground tabular-nums">
        {stock.distributed.toLocaleString()} distributed ·{" "}
        {Math.max(0, stock.total - stock.distributed).toLocaleString()} left
      </span>
    </Field>
  )
}

function CoinTiers({
  tiers,
  errors,
}: {
  tiers: SilverCoinTier[]
  errors: NonNullable<SaveSettingsState["fieldErrors"]>
}) {
  const sorted = sortTiers(tiers.length > 0 ? tiers : DEFAULT_COIN_TIERS)
  const tier0 = sorted[0] ?? DEFAULT_COIN_TIERS[0]!
  const tier1 = sorted[1] ?? DEFAULT_COIN_TIERS[1]!
  const tierOpen =
    sorted.find((t) => t.upTo === null) ?? sorted[2] ?? DEFAULT_COIN_TIERS[2]!

  return (
    <div className="flex flex-col gap-4">
      <TierRow
        label="Up to"
        upToName="silverCoinTier0UpTo"
        upToDefault={tier0.upTo ?? DEFAULT_COIN_TIERS[0]!.upTo!}
        coinsName="silverCoinTier0Coins"
        coinsDefault={tier0.coins}
        upToError={errors.silverCoinTier0UpTo}
        coinsError={errors.silverCoinTier0Coins}
      />
      <TierRow
        label="Up to"
        upToName="silverCoinTier1UpTo"
        upToDefault={tier1.upTo ?? DEFAULT_COIN_TIERS[1]!.upTo!}
        coinsName="silverCoinTier1Coins"
        coinsDefault={tier1.coins}
        upToError={errors.silverCoinTier1UpTo}
        coinsError={errors.silverCoinTier1Coins}
      />
      <TierRow
        label="More than tier 2"
        coinsName="silverCoinTier2Coins"
        coinsDefault={tierOpen.coins}
        coinsError={errors.silverCoinTier2Coins}
      />
    </div>
  )
}

function TierRow({
  label,
  upToName,
  upToDefault,
  coinsName,
  coinsDefault,
  upToError,
  coinsError,
}: {
  label: string
  upToName?: string
  upToDefault?: number
  coinsName: string
  coinsDefault: number
  upToError?: string
  coinsError?: string
}) {
  const openEnded = !upToName
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        {openEnded ? (
          <span className="font-medium tabular-nums">sales</span>
        ) : (
          <>
            <Input
              type="number"
              name={upToName}
              min={1}
              step={1}
              defaultValue={upToDefault}
              className="w-[110px] tabular-nums"
            />
            <span className="text-muted-foreground">sales</span>
          </>
        )}
        <span className="text-muted-foreground">→</span>
        <Input
          type="number"
          name={coinsName}
          min={0}
          step={1}
          defaultValue={coinsDefault}
          className="w-[80px] tabular-nums"
        />
        <span className="text-muted-foreground">silver coins per day</span>
      </div>
      {upToError || coinsError ? (
        <span className="text-xs text-destructive">
          {upToError ?? coinsError}
        </span>
      ) : null}
    </div>
  )
}
