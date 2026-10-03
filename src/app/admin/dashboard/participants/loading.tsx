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
        title="Participants"
        description="Customers who submitted the campaign form."
      />

      <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 max-w-sm min-w-[220px] flex-1" />
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="ml-auto h-3 w-[56px]" />
        </div>

        <div className="overflow-hidden rounded border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Scratch</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Participated</TableHead>
                <TableHead className="w-[132px] pr-4 text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[130px]" />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-[110px]" />
                      <Skeleton className="h-3 w-[64px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[84px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[76px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[96px]" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="ml-auto h-6 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-3 w-[96px]" />
          <Skeleton className="h-7 w-[300px]" />
        </div>
      </div>
    </>
  )
}
