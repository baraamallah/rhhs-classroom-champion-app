import { NextResponse, type NextRequest } from "next/server"
import { decodeSessionToken } from "@/lib/auth/session"

export async function middleware(request: NextRequest) {
  // Get session cookie
  const sessionCookie = request.cookies.get("eco_session")?.value
  const session = await decodeSessionToken(sessionCookie)

  // Protected routes that require authentication
  const protectedRoutes = ["/admin", "/supervisor"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (session && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone()

    // Redirect based on role
    if (session.role === "super_admin" || session.role === "admin") {
      url.pathname = "/admin"
    } else if (session.role === "supervisor") {
      url.pathname = "/supervisor"
    } else {
      url.pathname = "/"
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
