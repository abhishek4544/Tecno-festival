import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div
      className="@container/main flex flex-1 flex-col gap-6 py-4 md:py-6"
      aria-busy="true"
    >
      <section className="flex flex-wrap items-baseline justify-between gap-2 px-4 lg:px-6">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-3 w-[170px]" />
      </section>

      <section className="grid grid-cols-1 gap-3 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </section>

      <section className="px-4 lg:px-6">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Today&apos;s draw
            </span>
            <DrawRowSkeleton />
            <DrawRowSkeleton />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function KpiCardSkeleton() {
  return (
    <Card className="bg-card shadow-xs">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="size-[24px] rounded-[3px]" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
        <Skeleton className="h-9 w-[80px]" />
        <Skeleton className="h-3 w-[140px]" />
      </CardContent>
    </Card>
  )
}

function DrawRowSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-3 w-[40px]" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="h-3 w-[260px] max-w-full" />
    </div>
  )
}
