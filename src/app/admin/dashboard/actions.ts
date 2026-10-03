"use server"

import { requireAdmin } from "@/lib/auth"
import { listRecentParticipants, type RecentParticipant } from "@/lib/db-queries"

const RECENT_LIMIT = 20

export type RecentParticipantsResult =
  | { ok: true; entries: RecentParticipant[] }
  | { ok: false }

/** Polled by the header's notifications bell. */
export async function getRecentParticipants(): Promise<RecentParticipantsResult> {
  await requireAdmin()
  try {
    return { ok: true, entries: await listRecentParticipants(RECENT_LIMIT) }
  } catch (error) {
    console.error("Failed to load recent participants", error)
    return { ok: false }
  }
}
