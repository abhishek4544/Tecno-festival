"use client"

import { useActionState } from "react"
import { AlertTriangleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { login, type LoginState } from "./actions"

const initial: LoginState = {}

export function LoginForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(login, initial)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="from" value={from} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={state.message ? true : undefined}
          aria-describedby={state.message ? "login-error" : undefined}
        />
      </div>

      {state.message ? (
        <div
          id="login-error"
          role="alert"
          className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
