"use client"

import * as React from "react"
import { useActionState } from "react"
import { AlertTriangleIcon, PlusIcon } from "lucide-react"

import { addImei, type AddImeiState } from "@/app/admin/dashboard/imei-registry/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { AssignedPrize } from "@/lib/types"

const initial: AddImeiState = { ok: false }

// Add IMEI only assigns random-pool prizes. Gold Kite is NOT assignable here —
// it's a lottery drawn later from all valid entries.
type RandomPrize = Extract<AssignedPrize, "SilverKite" | "SilverCoin">

export function AddImeiSheet() {
  const [open, setOpen] = React.useState(false)
  const [state, formAction, pending] = useActionState(addImei, initial)
  const [prize, setPrize] = React.useState<RandomPrize | "">("")
  const formRef = React.useRef<HTMLFormElement | null>(null)

  // Close + reset when a submission succeeds
  React.useEffect(() => {
    if (state.ok) {
      setOpen(false)
      setPrize("")
      formRef.current?.reset()
    }
  }, [state])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            Add IMEI
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add IMEI</SheetTitle>
          <SheetDescription>
            Register one eligible device for the active campaign.
          </SheetDescription>
        </SheetHeader>

        <form ref={formRef} action={formAction} className="flex flex-col gap-5 px-4">
          <Field label="IMEI" error={state.fieldErrors?.imei}>
            <Input
              name="imei"
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              placeholder="15-digit IMEI"
              className="font-mono tabular-nums"
            />
          </Field>

          <Field label="Assigned prize">
            <input type="hidden" name="prize" value={prize} />
            <Select
              value={prize === "" ? "none" : prize}
              onValueChange={(v) => setPrize(v === "none" ? "" : (v as RandomPrize))}
            >
              <SelectTrigger className="max-w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Random Gift</SelectItem>
                <SelectItem value="SilverCoin">Silver Coin</SelectItem>
                <SelectItem value="SilverKite">Silver Kite</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              Random Gift lets the scratch outcome be Silver Kite, Silver Coin,
              or Try Again. Pick a specific gift to pre-assign it. Gold Kite is
              drawn later from all valid entries, not set here.
            </span>
          </Field>

          <Field label="Notes">
            <textarea
              name="notes"
              rows={3}
              placeholder="Optional"
              className="min-h-[72px] w-full resize-y rounded-sm border border-input bg-background px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            />
          </Field>

          {state.message ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertTriangleIcon className="mt-0.5 size-4" />
              <span>{state.message}</span>
            </div>
          ) : null}
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t">
          <SheetClose render={<Button variant="ghost" size="sm" />}>
            Cancel
          </SheetClose>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {pending ? "Saving…" : "Save IMEI"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
