"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth, useClerk, useUser } from "@clerk/nextjs"
import { setAuthTokenGetter, setInMemoryAuthToken } from "@/lib/api/client"
import { syncBackendUserProfile } from "@/lib/api/user-sync"
import { Search, User, ShoppingCart, Sun, Moon } from "lucide-react"
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
  const role =
    (typeof user?.publicMetadata?.role === "string" && user.publicMetadata.role) ||
    (typeof user?.unsafeMetadata?.role === "string" && user.unsafeMetadata.role) ||
    null

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
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Mobile search: when visible, hide logo/sidebar and span input full width */}
        {showMobileSearch ? (
          <form onSubmit={handleSearch} className="flex w-full items-center gap-2 md:hidden">
            <Input
              ref={mobileInputRef}
              type="search"
              placeholder="Search products..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => setShowMobileSearch(false)}
            />
            <Button type="submit" size="icon">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarToggle />
              <Link href="/" className="flex items-center gap-2">
                <span className="font-bold lg:text-xl md:text-sm">Try-On Store</span>
              </Link>
            </div>

            <form onSubmit={handleSearch} className="hidden md:flex w-full max-w-sm items-center space-x-2 mx-4">
              <Input
                type="search"
                placeholder="Search products..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>

            <div className="flex items-center gap-2">
              {/* Mobile search icon */}
              <div className="relative md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setShowMobileSearch(true)}
                >
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
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

              <Button variant="ghost" size="icon" asChild className="relative">
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
