import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

type Claims = Record<string, unknown> | null | undefined

const isAdminRoute = (pathname: string) => pathname.startsWith("/admin")

const isProtectedRoute = (pathname: string) =>
  pathname.startsWith("/orders") ||
  pathname.startsWith("/profile") ||
  pathname.startsWith("/checkout") ||
  pathname.startsWith("/cart") ||
  isAdminRoute(pathname)

function getRoleFromClaims(claims: Claims): string | null {
  const directRole = claims?.role
  if (typeof directRole === "string") return directRole

  const metadataRole = (claims?.metadata as Record<string, unknown> | undefined)?.role
  if (typeof metadataRole === "string") return metadataRole

  const publicMetadataRole = (claims?.publicMetadata as Record<string, unknown> | undefined)?.role
  if (typeof publicMetadataRole === "string") return publicMetadataRole

  const snakeCaseMetadataRole = (claims?.public_metadata as Record<string, unknown> | undefined)?.role
  if (typeof snakeCaseMetadataRole === "string") return snakeCaseMetadataRole

  return null
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", `${pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute(pathname)) {
    const role = getRoleFromClaims(sessionClaims as Claims)

    if (role !== "admin") {
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
