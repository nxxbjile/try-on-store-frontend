"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, ShoppingBag, Users, Settings, BarChart3, Package, Tag } from "lucide-react"
import { useStore } from "@/lib/store"

export default function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isSidebarOpen, closeSidebar } = useStore()

  // Close sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        closeSidebar()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [closeSidebar])

  const navItems = [
    { name: "Dashboard", href: "/admin", tab: "dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/admin?tab=orders", tab: "orders", icon: ShoppingBag },
    { name: "Products", href: "/admin?tab=products", tab: "products", icon: Package },
    { name: "Customers", href: "/admin?tab=customers", tab: "customers", icon: Users },
    { name: "Categories", href: "/admin?tab=categories", tab: "categories", icon: Tag },
    { name: "Analytics", href: "/admin?tab=analytics", tab: "analytics", icon: BarChart3 },
    { name: "Settings", href: "/admin?tab=settings", tab: "settings", icon: Settings },
  ]

  const currentTab = searchParams.get("tab") || "dashboard"

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-4 shadow-md transition-all duration-300 ease-in-out",
        "fixed left-4 top-20 z-40 w-64 md:sticky md:left-auto md:top-24 md:w-64 md:shrink-0",
        "md:translate-x-0",
        isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[115%] opacity-0 pointer-events-none",
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <Button variant="ghost" size="sm" className="md:hidden" onClick={closeSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === "/admin" && currentTab === item.tab

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-300",
                "before:absolute before:inset-0 before:bg-linear-to-r before:from-[hsl(var(--accent-strong))]/25 before:to-transparent before:opacity-0 before:transition-all before:duration-300 before:ease-out before:-translate-x-4",
                "hover:before:opacity-100 hover:before:translate-x-0 hover:text-foreground",
                isActive &&
                  "bg-accent/80 font-medium after:absolute after:bottom-1.5 after:left-0 after:top-1.5 after:w-1 after:rounded-r-full after:bg-[hsl(var(--accent-strong))]",
              )}
              onClick={() => closeSidebar()}
            >
              <item.icon className="relative z-10 h-5 w-5" />
              <span className="relative z-10">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 rounded-xl bg-accent/50 p-3">
          <p className="text-sm font-medium">Admin Mode</p>
          <p className="text-xs text-muted-foreground">Logged in as Admin</p>
      </div>
    </div>
  )
}
