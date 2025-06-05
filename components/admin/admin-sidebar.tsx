"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, ShoppingBag, Users, Settings, BarChart3, Package, Tag } from "lucide-react"
import { useStore } from "@/lib/store"

export default function AdminSidebar() {
  const pathname = usePathname()
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
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin?tab=orders", icon: ShoppingBag },
    { name: "Products", href: "/admin?tab=products", icon: Package },
    { name: "Customers", href: "/admin?tab=customers", icon: Users },
    { name: "Categories", href: "/admin?tab=categories", icon: Tag },
    { name: "Analytics", href: "/admin?tab=analytics", icon: BarChart3 },
    { name: "Settings", href: "/admin?tab=settings", icon: Settings },
  ]

  return (
    <div
      className={cn(
        "bg-card rounded-lg p-4 transition-all duration-300 ease-in-out",
        "fixed md:sticky top-16 h-[calc(100vh-4rem)] z-40 w-64",
        "md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl">Admin Panel</h2>
        <Button variant="ghost" size="sm" className="md:hidden" onClick={closeSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname === "/admin" && item.href.includes(pathname)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors",
                isActive && "bg-accent font-medium",
              )}
              onClick={() => closeSidebar()}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-accent/50 rounded-lg p-3">
          <p className="text-sm font-medium">Admin Mode</p>
          <p className="text-xs text-muted-foreground">Logged in as Admin</p>
        </div>
      </div>
    </div>
  )
}
