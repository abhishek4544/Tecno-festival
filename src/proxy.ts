import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token"

const LOGIN_PATH = "/admin/login"

// Optimistic check from the cookie only. Server actions re-check the session
// via requireAdmin() in src/lib/auth.ts.
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isLoginPage = pathname === LOGIN_PATH
  const isSignedIn = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  )

  if (!isSignedIn && !isLoginPage) {
    const loginUrl = new URL(LOGIN_PATH, request.nextUrl)
    loginUrl.searchParams.set("from", pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  if (isSignedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
