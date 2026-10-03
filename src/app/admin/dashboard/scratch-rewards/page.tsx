import { PageHeader } from "@/components/dashboard/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCampaignSettings } from "@/lib/db-queries"

type Reward = {
  name: "Silver Kite" | "Silver Coin"
  total: number
  distributed: number
  tone: string
}

export default async function Page() {
  const settings = await getCampaignSettings()

  const rewards: Reward[] = settings
    ? [
        {
          name: "Silver Kite",
          total: settings.silverKite.total,
          distributed: settings.silverKite.distributed,
          tone: "var(--chart-5)",
        },
        {
          name: "Silver Coin",
          total: settings.silverCoin.total,
          distributed: settings.silverCoin.distributed,
          tone: "var(--chart-2)",
        },
      ]
    : []

  return (
    <>
      <PageHeader
        title="Scratch Rewards"
        description="Silver Kite and Silver Coin inventory."
      />

      <div className="flex flex-col gap-4 p-4 md:p-6">
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
              {rewards.map((r) => {
                const remaining = r.total - r.distributed
                const pct = r.total > 0 ? Math.round((r.distributed / r.total) * 100) : 0
                return (
                  <TableRow key={r.name}>
                    <TableCell className="pl-4 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{ background: r.tone }}
                        />
                        {r.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.total.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums font-medium"
                      style={{ color: r.tone }}
                    >
                      {r.distributed.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {remaining.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${pct}%`, background: r.tone }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
