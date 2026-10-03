import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session-token"

export async function createSession() {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, await signSessionToken(expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: new Date(expiresAt),
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete({ name: SESSION_COOKIE, path: "/admin" })
}

export const isAdmin = cache(async () => {
  const cookieStore = await cookies()
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)
})

/**
 * Guard for server actions and server components. proxy.ts already redirects
 * signed-out page visits, but server actions are callable directly, so every
 * mutation must check the session itself.
 */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login")
}
