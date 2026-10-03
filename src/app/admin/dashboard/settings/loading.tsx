import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <>
      <PageHeader
        title="Campaign Settings"
        description="Loading campaign…"
        actions={<Skeleton className="h-8 w-[112px]" />}
      />

      <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FieldSkeleton inputWidth="w-[200px]" />
              <FieldSkeleton inputWidth="w-[200px]" />
            </div>
            <FieldSkeleton inputWidth="w-[200px]" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold">Reward inventory</h2>
              <p className="text-xs text-muted-foreground">
                How many of each instant reward are available. Cannot be lowered
                below what&rsquo;s already distributed.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <FieldSkeleton inputWidth="w-[180px]" withHint />
              <FieldSkeleton inputWidth="w-[180px]" withHint />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <ToggleSkeleton />
            <Separator />
            <ToggleSkeleton />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function FieldSkeleton({
  inputWidth,
  withHint = false,
}: {
  inputWidth: string
  withHint?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-3 w-[80px]" />
      <Skeleton className={`h-8 max-w-full ${inputWidth}`} />
      {withHint ? <Skeleton className="h-3 w-[120px]" /> : null}
    </div>
  )
}

function ToggleSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="mt-0.5 size-[16px] rounded-[4px]" />
      <div className="flex flex-1 flex-col gap-0.5">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-3 w-[280px] max-w-full" />
      </div>
    </div>
  )
}
