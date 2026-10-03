import { AddImeiSheet } from "@/components/dashboard/add-imei-sheet"
import { ImportImeiSheet } from "@/components/dashboard/import-imei-sheet"
import { PageHeader } from "@/components/dashboard/page-header"
import { getActiveCampaign, listImeis } from "@/lib/db-queries"
import { ImeiTable } from "./imei-table"

export default async function Page() {
  const campaign = await getActiveCampaign()
  const rows = campaign ? await listImeis(campaign.id) : []

  return (
    <>
      <PageHeader
        title="IMEI Registry"
        description="Eligible devices for the campaign."
        actions={
          <>
            <ImportImeiSheet />
            <AddImeiSheet />
          </>
        }
      />

      <div className="flex flex-col gap-4 p-4 md:p-6">
        {!campaign ? (
          <div className="rounded border bg-card p-6 text-sm text-muted-foreground">
            No active campaign. Set one up in Campaign Settings first.
          </div>
        ) : (
          <ImeiTable rows={rows} />
        )}
      </div>
    </>
  )
}
