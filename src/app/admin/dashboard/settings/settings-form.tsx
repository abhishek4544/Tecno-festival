"use client"

import * as React from "react"
import { useActionState } from "react"
import { AlertTriangleIcon, CheckCircle2Icon, GiftIcon, SparklesIcon } from "lucide-react"

import {
  saveCampaignSettings,
  type SaveSettingsState,
} from "@/app/admin/dashboard/settings/actions"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CampaignSettings } from "@/lib/db-queries"
import type { CampaignStatus } from "@/lib/types"

const statuses: CampaignStatus[] = [
  "Draft",
  "Scheduled",
  "Active",
  "Paused",
  "Completed",
]

const initial: SaveSettingsState = { ok: false }

export function SettingsForm({ settings }: { settings: CampaignSettings }) {
  const [state, formAction, pending] = useActionState(
    saveCampaignSettings,
    initial,
  )
  const [status, setStatus] = React.useState<CampaignStatus>(settings.status)
  const [scratchEnabled, setScratchEnabled] = React.useState(
    settings.scratchEnabled,
  )
  const [goldKiteEnabled, setGoldKiteEnabled] = React.useState(
    settings.goldKiteEnabled,
  )
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
                  {statuses.map((s) => (
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
              <h2 className="text-sm font-semibold">Reward inventory</h2>
              <p className="text-xs text-muted-foreground">
                How many of each instant reward are available. Cannot be lowered
                below what&rsquo;s already distributed.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <RewardField
                name="silverKiteTotal"
                label="Silver Kite"
                tone="var(--chart-5)"
                icon={SparklesIcon}
                defaultValue={settings.silverKite.total}
                distributed={settings.silverKite.distributed}
                error={errs.silverKiteTotal}
              />
              <RewardField
                name="silverCoinTotal"
                label="Silver Coin"
                tone="var(--chart-2)"
                icon={GiftIcon}
                defaultValue={settings.silverCoin.total}
                distributed={settings.silverCoin.distributed}
                error={errs.silverCoinTotal}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <Toggle
              name="scratchEnabled"
              label="Scratch card enabled"
              hint="Customers with valid IMEIs can reveal an instant reward."
              checked={scratchEnabled}
              onChange={setScratchEnabled}
            />

            <Separator />

            <Toggle
              name="goldKiteEnabled"
              label="Gold Kite Grand Draw enabled"
              hint="The pre-marked IMEI wins the Grand Prize when it registers."
              checked={goldKiteEnabled}
              onChange={setGoldKiteEnabled}
            />
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

function RewardField({
  name,
  label,
  tone,
  icon: Icon,
  defaultValue,
  distributed,
  error,
}: {
  name: string
  label: string
  tone: string
  icon: React.ComponentType<{ className?: string }>
  defaultValue: number
  distributed: number
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase"
        style={{ color: tone }}
      >
        <Icon className="size-3.5" />
        {label}
      </Label>
      <Input
        type="number"
        name={name}
        min={0}
        defaultValue={defaultValue}
        className="max-w-[180px] tabular-nums"
      />
      <span className="text-xs text-muted-foreground tabular-nums">
        {distributed.toLocaleString()} already distributed
      </span>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : null}
    </div>
  )
}

function Toggle({
  name,
  label,
  hint,
  checked,
  onChange,
}: {
  name: string
  label: string
  hint: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="group/field flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={() => {}}
        className="sr-only"
      />
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
        className="mt-0.5"
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </label>
  )
}
