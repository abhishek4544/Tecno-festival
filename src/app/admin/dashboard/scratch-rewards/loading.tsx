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
        title="Scratch Rewards"
        description="Silver Kite and Silver Coin inventory."
      />

      <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true">
        <div className="overflow-hidden rounded border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-4">Reward</TableHead>
                <TableHead className="text-right tabular-nums">Total</TableHead>
                <TableHead className="text-right tabular-nums">Distributed</TableHead>
                <TableHead className="text-right tabular-nums">Remaining</TableHead>
                <TableHead className="w-[32%]">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 2 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-4 w-[96px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-[32px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-1.5 flex-1 rounded-full" />
                      <Skeleton className="h-3 w-[40px]" />
                    </div>
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
