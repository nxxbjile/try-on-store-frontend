"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth, useClerk, useUser } from "@clerk/nextjs"
import { apiRequest, setAuthTokenGetter, setInMemoryAuthToken } from "@/lib/api/client"
import { syncBackendUserProfile } from "@/lib/api/user-sync"
import { Search, User, ShoppingCart, Sun, Moon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import SidebarToggle from "@/components/sidebar-toggle"
import { useStore } from "@/lib/store"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { cartItems, getCartItems } = useStore()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { signOut } = useClerk()
  const { user } = useUser()
  const role = useStore((state) => state.user?.role)

  // Fix hydration mismatch for theme icon
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const syncToken = async () => {
      if (!isLoaded) return

      if (!isSignedIn) {
        setAuthTokenGetter(null)
        setInMemoryAuthToken(null)
        useStore.setState({ user: null, cartItems: [], tryonImages: [] })
        return
      }

      setAuthTokenGetter(() => getToken())

      const token = await getToken()
      if (token) {
        try {
          await syncBackendUserProfile(token, {
            name: user?.fullName || undefined,
            email: user?.primaryEmailAddress?.emailAddress || undefined,
          })
        } catch {
          // Sync may temporarily fail; middleware and later actions can retry.
        }

        try {
          const currentUser = await apiRequest("/users/me", { method: "GET" })
          useStore.setState({ user: currentUser })
        } catch {
          // If profile fetch fails, keep existing user state.
        }

        try {
          await getCartItems()
        } catch {
          // Cart prefetch should not break header rendering.
        }
      }
    }

    void syncToken()
  }, [getCartItems, getToken, isLoaded, isSignedIn, user?.fullName, user?.primaryEmailAddress?.emailAddress])

  useEffect(() => {
    if (showMobileSearch && mobileInputRef.current) {
      mobileInputRef.current.focus()
    }
  }, [showMobileSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?name=${encodeURIComponent(searchQuery.trim())}&sort=createdAt&order=desc&page=1&limit=20`)
      setShowMobileSearch(false)
    }
  }

  const handleLogout = async () => {
    setAuthTokenGetter(null)
    setInMemoryAuthToken(null)
    useStore.setState({ user: null, cartItems: [], tryonImages: [] })
    await signOut({ redirectUrl: "/" })
  }

  return (
    <header className="sticky top-0 z-50 w-full flex items-center justify-center border-b border-border/70 bg-background/90 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="container flex h-18 w-full items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:gap-4 md:px-6">
        {/* Mobile search: when visible, hide logo/sidebar and span input full width */}
        {showMobileSearch ? (
          <form onSubmit={handleSearch} className="flex w-full items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Input
                ref={mobileInputRef}
                type="text"
                placeholder="Search products..."
                className="h-9 w-full rounded-xl border-border/70 bg-[hsl(var(--surface-2))]/70 pr-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setShowMobileSearch(false)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <Button type="submit" className="h-9 rounded-xl px-3" size="sm">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-3">
              <SidebarToggle />
              <Link href="/" className="flex min-w-0 items-center gap-2">
                <span className="max-w-38 truncate text-lg font-bold tracking-tight sm:max-w-none md:text-xl">Try-On Store</span>
              </Link>
            </div>

            <form
              onSubmit={handleSearch}
              className="mx-2 hidden min-w-0 flex-1 items-center gap-2 md:flex md:max-w-lg"
            >
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="h-9 w-full rounded-xl border-border/70 bg-[hsl(var(--surface-2))]/70 px-4 pr-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <Button type="submit" className="h-9 rounded-xl px-3 lg:px-4" size="sm">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Button>
            </form>

            <div className="flex shrink-0 items-center gap-1 md:gap-2">
              {/* Mobile search icon */}
              <div className="relative md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="rounded-xl"
                  onClick={() => setShowMobileSearch(true)}
                >
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isSignedIn ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/orders">My Orders</Link>
                      </DropdownMenuItem>
                      {role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/login">Login</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/register">Register</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      {mounted ? (
                        theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />
                      ) : null}
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button variant="ghost" size="icon" asChild className="relative rounded-xl">
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItems.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center translate-x-1/4 -translate-y-1/4">
                      {cartItems.length}
                    </span>
                  )}
                  <span className="sr-only">Cart</span>
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
