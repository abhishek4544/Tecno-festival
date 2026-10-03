import "server-only"

import { isIP } from "node:net"
import { headers } from "next/headers"

import { sql } from "@/lib/db"

export const AUDIT_ACTIONS = {
  "admin.login": "Logged in",
  "admin.login_failed": "Failed login",
  "admin.logout": "Logged out",
  "imei.add": "Added IMEI",
  "imei.import": "Imported IMEIs",
  "imei.prize": "Changed prize",
  "verification.pass": "Passed verification",
  "verification.fail": "Failed verification",
  "settings.update": "Updated settings",
} as const

export type AuditAction = keyof typeof AUDIT_ACTIONS

type AuditEntry = {
  action: AuditAction
  /** One line shown in the Logs page, e.g. "IMEI 3505… prize: none → Silver Coin". */
  summary: string
  campaignId?: string | null
  entityType?: "imei" | "participant" | "campaign" | "import_batch"
  entityId?: string | null
  /** Extra structured detail kept alongside the summary. */
  details?: Record<string, unknown>
}

async function requestIp() {
  const headerList = await headers()
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip")
  return ip && isIP(ip) ? ip : null
}

/**
 * Records an admin change in audit_logs. There's one shared admin login, so
 * the actor is always "Admin"; the IP tells sessions apart. Never throws:
 * a logging failure must not undo or block the change itself.
 */
export async function logAdminAction(entry: AuditEntry) {
  try {
    const meta = {
      summary: entry.summary,
      ip: await requestIp(),
      ...entry.details,
    }
    await sql`
      INSERT INTO audit_logs (campaign_id, actor, action, entity_type, entity_id, meta)
      VALUES (
        ${entry.campaignId ?? null}, 'Admin', ${entry.action},
        ${entry.entityType ?? null}, ${entry.entityId ?? null}, ${JSON.stringify(meta)}::jsonb
      )
    `
  } catch (error) {
    console.error("Failed to write audit log", entry.action, error)
  }
}
