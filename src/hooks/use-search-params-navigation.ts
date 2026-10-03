"use client"

import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type ParamUpdates = Record<string, string | number | null>

/**
 * Updates the current URL's search params (null or "" removes a key) so the
 * server page re-renders with the new filters. `isPending` stays true until
 * the new data arrives.
 */
export function useSearchParamsNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function navigate(updates: ParamUpdates) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key)
      else params.set(key, String(value))
    }
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  return { navigate, isPending }
}
