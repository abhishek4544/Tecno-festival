"use client"

import { useEffect } from "react"
import { RotateCcwIcon, ServerCrashIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

// Fallback for any dashboard page that fails to load, e.g. when the database
// can't be reached. The sidebar and header stay in place around it.
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-4 md:p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ServerCrashIcon className="size-5" />
        </span>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-medium">Couldn&apos;t load this page</h2>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t fetch the data right now. This is usually a
            temporary connection problem. Please try again.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => retry()}>
          <RotateCcwIcon />
          Try again
        </Button>

        {error.digest ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            Error ID: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  )
}
