import { NextResponse, type NextRequest } from "next/server"
import { decodeSessionToken } from "@/lib/auth/session"

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("eco_session")?.value
  const session = await decodeSessionToken(sessionCookie)
  const pathname = request.nextUrl.pathname

  const isAdminRoute = pathname.startsWith("/admin")
  const isSupervisorRoute = pathname.startsWith("/supervisor")

  // Redirect unauthenticated users trying to access protected routes
  if ((isAdminRoute || isSupervisorRoute) && !session) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Enforce role boundaries on protected routes before rendering
  if (session) {
    const role = session.role ? String(session.role).trim().toLowerCase() : ""

    if (isAdminRoute && !["super_admin", "admin", "stats"].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = role === "supervisor" ? "/supervisor" : "/"
      return NextResponse.redirect(url)
    }

    if (isSupervisorRoute && role !== "supervisor") {
      const url = request.nextUrl.clone()
      url.pathname =
        role === "super_admin" || role === "admin"
          ? "/admin"
          : role === "stats"
            ? "/admin/tracking"
            : "/"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from login page
    if (pathname === "/login") {
      const url = request.nextUrl.clone()
      if (role === "super_admin" || role === "admin") {
        url.pathname = "/admin"
      } else if (role === "supervisor") {
        url.pathname = "/supervisor"
      } else if (role === "stats") {
        url.pathname = "/admin/tracking"
      } else {
        url.pathname = "/"
      }
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
