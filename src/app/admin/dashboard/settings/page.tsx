import { connection } from "next/server"

import { PageHeader } from "@/components/dashboard/page-header"
import { getCampaignSettings } from "@/lib/db-queries"
import { SettingsForm } from "./settings-form"

export default async function Page() {
  // Render per request so the form always loads the saved settings.
  await connection()
  const settings = await getCampaignSettings()

  if (!settings) {
    return (
      <>
        <PageHeader
          title="Campaign Settings"
          description="Configuration for the current campaign."
        />
        <div className="p-4 md:p-6">
          <div className="rounded border bg-card p-6 text-sm text-muted-foreground">
            No active campaign.
          </div>
        </div>
      </>
    )
  }

  return <SettingsForm settings={settings} />
}
