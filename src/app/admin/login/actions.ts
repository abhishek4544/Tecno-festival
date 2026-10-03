"use server"

import { createHash, timingSafeEqual } from "node:crypto"
import { redirect } from "next/navigation"

import { logAdminAction } from "@/lib/audit-log"
import { createSession, deleteSession } from "@/lib/auth"

export type LoginState = { message?: string }

function sha256(value: string) {
  return createHash("sha256").update(value).digest()
}

// Only allow redirects back into the admin area (no open redirects).
function safeRedirectTarget(from: string) {
  return from.startsWith("/admin/") && !from.startsWith("//")
    ? from
    : "/admin/dashboard"
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    return { message: "Admin login is not configured. Set ADMIN_PASSWORD." }
  }

  const password = String(formData.get("password") ?? "")
  // Hash both sides so the comparison is constant-time and length-independent.
  if (!password || !timingSafeEqual(sha256(password), sha256(expected))) {
    await logAdminAction({
      action: "admin.login_failed",
      summary: "Failed login attempt (incorrect password)",
    })
    return { message: "Incorrect password." }
  }

  await createSession()
  await logAdminAction({ action: "admin.login", summary: "Logged in" })
  redirect(safeRedirectTarget(String(formData.get("from") ?? "")))
}

export async function logout() {
  await logAdminAction({ action: "admin.logout", summary: "Logged out" })
  await deleteSession()
  redirect("/admin/login")
}
