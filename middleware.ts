import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = (pathname: string) => pathname.startsWith("/admin")

const isProtectedRoute = (pathname: string) =>
  pathname.startsWith("/orders") ||
  pathname.startsWith("/profile") ||
  pathname.startsWith("/checkout") ||
  pathname.startsWith("/cart") ||
  isAdminRoute(pathname)

const API_BASE_URL =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1"

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

  const { userId, getToken } = await auth()

  if (!userId) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", `${pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute(pathname)) {
    const token = await getToken()

    if (!token) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return NextResponse.redirect(new URL("/", req.url))
      }

      const backendUser = await response.json()
      const role = backendUser?.role

      if (role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    } catch {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
