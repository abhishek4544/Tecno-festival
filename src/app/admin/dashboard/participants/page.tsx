import { PageHeader } from "@/components/dashboard/page-header"
import { mockParticipants } from "@/lib/mock-participants"
import { ParticipantsTable } from "./participants-table"

export default function Page() {
  return (
    <>
      <PageHeader
        title="Participants"
        description="Customers who submitted the campaign form."
      />

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <ParticipantsTable rows={mockParticipants} />
      </div>
    </>
  )
}
