import type { Metadata } from "next"
import { SparklesIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Admin sign in · TECNO Campaign",
  robots: { index: false, follow: false },
}

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const { from } = await props.searchParams

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="flex w-full max-w-[360px] flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <SparklesIcon className="size-5" strokeWidth={1.5} />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">
            TECNO Campaign admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the admin password to continue.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <LoginForm from={typeof from === "string" ? from : ""} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
