"use client"

import * as React from "react"
import Link from "next/link"
import { BellIcon } from "lucide-react"

import { getRecentParticipants } from "@/app/admin/dashboard/actions"
import { ScratchBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { RecentParticipant } from "@/lib/db-queries"
import { cn } from "@/lib/utils"

const POLL_MS = 30_000
// Per-browser marker of the newest entry the admin has seen.
const LAST_SEEN_KEY = "admin-notifications-last-seen"

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

function timeAgo(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return relativeTime.format(seconds, "second")
  if (abs < 3600) return relativeTime.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return relativeTime.format(Math.round(seconds / 3600), "hour")
  return relativeTime.format(Math.round(seconds / 86400), "day")
}

function readLastSeen() {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(LAST_SEEN_KEY)
  } catch {
    return null
  }
}

function writeLastSeen(value: string) {
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, value)
  } catch {
    // Storage blocked (private mode etc.): the badge just won't persist.
  }
}

export function NotificationsSheet() {
  const [open, setOpen] = React.useState(false)
  const [entries, setEntries] = React.useState<RecentParticipant[] | null>(null)
  const [hasError, setHasError] = React.useState(false)
  const [lastSeen, setLastSeen] = React.useState<string | null>(readLastSeen)
  // Entries newer than this get a "new" dot while the panel is open.
  const [highlightSince, setHighlightSince] = React.useState<string | null>(null)
  const openRef = React.useRef(false)

  function markSeen(list: RecentParticipant[]) {
    const newest = list[0]?.participatedAt
    if (!newest) return
    setLastSeen(newest)
    writeLastSeen(newest)
  }

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      if (document.visibilityState !== "visible") return
      try {
        const result = await getRecentParticipants()
        if (cancelled) return
        if (!result.ok) {
          setHasError(true)
          return
        }
        setHasError(false)
        setEntries(result.entries)
        // Anything that arrives while the panel is open counts as seen.
        if (openRef.current) markSeen(result.entries)
      } catch {
        if (!cancelled) setHasError(true)
      }
    }

    void load()
    const timer = setInterval(load, POLL_MS)
    document.addEventListener("visibilitychange", load)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener("visibilitychange", load)
    }
  }, [])

  const unread =
    entries?.filter((e) => !lastSeen || e.participatedAt > lastSeen).length ?? 0

  function changeOpen(next: boolean) {
    setOpen(next)
    openRef.current = next
    if (next) {
      setHighlightSince(lastSeen)
      if (entries) markSeen(entries)
    }
  }

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              unread > 0 ? `Notifications, ${unread} new` : "Notifications"
            }
            className="relative"
          />
        }
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Latest campaign entries. Checks for new ones every 30 seconds.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {hasError && !entries ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Couldn&apos;t load entries. Retrying shortly…
            </p>
          ) : entries === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No entries yet. New participants will show up here.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {entries.map((e) => {
                const isNew = !highlightSince || e.participatedAt > highlightSince
                return (
                  <li key={e.id} className="flex gap-3 py-3">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        isNew ? "bg-primary" : "bg-transparent",
                      )}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {e.name}
                          {isNew ? <span className="sr-only"> (new)</span> : null}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(e.participatedAt)}
                        </span>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {e.retailer}
                        {e.retailerAddress ? ` · ${e.retailerAddress}` : ""}
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {e.imei}
                        </span>
                        <ScratchBadge outcome={e.scratch} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="border-t">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/dashboard/participants" />}
            onClick={() => changeOpen(false)}
          >
            View all participants
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
