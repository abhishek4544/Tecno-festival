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
        title="IMEI Registry"
        description="Eligible devices for the campaign."
        actions={
          <>
            <Skeleton className="h-8 w-[84px]" />
            <Skeleton className="h-8 w-[96px]" />
          </>
        }
      />

      <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 max-w-sm min-w-[220px] flex-1" />
          <Skeleton className="h-8 w-[230px]" />
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="ml-auto h-3 w-[56px]" />
        </div>

        <div className="overflow-hidden rounded border bg-card">
          <Table className="min-w-[700px] table-fixed">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-4">IMEI</TableHead>
                <TableHead className="w-[200px] text-right">Status</TableHead>
                <TableHead className="w-[180px] text-right">Prize</TableHead>
                <TableHead className="w-[130px] pr-4 text-right">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-4 w-[140px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-5 w-[88px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-5 w-[110px]" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="ml-auto h-4 w-[80px]" />
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
