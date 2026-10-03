import { PageHeader } from "@/components/dashboard/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Loading() {
  return (
    <>
      <PageHeader
        title="Activity Logs"
        description="Every change made from the admin panel, newest first."
      />

      <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-[220px]" />
          <Skeleton className="ml-auto h-3 w-[56px]" />
        </div>

        <div className="overflow-hidden rounded border bg-card">
          <Table className="min-w-[760px] table-fixed">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[190px] pl-4">Time</TableHead>
                <TableHead className="w-[170px]">Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[140px] pr-4 text-right">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[110px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[70%]" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="ml-auto h-4 w-[90px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
