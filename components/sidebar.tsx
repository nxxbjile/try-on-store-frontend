"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

type Category = {
  _id: string
  name: string
  slug: string
}

export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([])
  const pathname = usePathname()
  const { isSidebarOpen, closeSidebar, openSidebar } = useStore()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // In a real app, we'd fetch from the API
        const mockCategories = [
          { _id: "1", name: "Shirts", slug: "shirt" },
          { _id: "2", name: "T-Shirts", slug: "t-shirt" },
          { _id: "3", name: "Pants", slug: "pants" },
        ]
        setCategories(mockCategories)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Close sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        closeSidebar()
      } else {
        openSidebar()
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [closeSidebar, openSidebar])

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      closeSidebar()
    }
  }

  return (
    <div
      className={cn(
        "z-40 overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-md backdrop-blur transition-all duration-300 ease-out md:sticky md:self-start md:backdrop-blur-0",
        "fixed left-3 right-3 top-20 w-auto max-w-72 md:left-auto md:right-auto md:top-24 md:w-72",
        isSidebarOpen
          ? "translate-x-0 opacity-100 md:w-64 md:min-w-64 md:mr-6 lg:mr-8"
          : "-translate-x-[115%] opacity-0 pointer-events-none md:translate-x-0 md:opacity-100 md:w-0 md:min-w-0 md:mr-0 md:border-transparent md:bg-transparent md:p-0 md:shadow-none",
      )}
    >
      <div className="mb-4 flex items-center justify-between border-b border-border/60 px-4 py-4 md:mb-5">
        <h2 className="text-lg font-semibold">Categories</h2>
        <Button variant="ghost" size="sm" className="md:hidden" onClick={closeSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Suspense fallback={<SidebarNavFallback categories={categories} onNavClick={handleNavClick} />}>
        <SidebarNav categories={categories} pathname={pathname} onNavClick={handleNavClick} />
      </Suspense>
    </div>
  )
}

function SidebarNav({
  categories,
  pathname,
  onNavClick,
}: {
  categories: Category[]
  pathname: string
  onNavClick: () => void
}) {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category")
  const isSearchPage = pathname === "/search"

  return (
    <nav className="space-y-1.5 px-3 pb-4">
      <Link
        href="/search?sort=createdAt&order=desc&page=1&limit=20"
        className={cn(
          "group relative block overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-300",
          "before:absolute before:inset-0 before:bg-linear-to-r before:from-[hsl(var(--accent-strong))]/25 before:to-transparent before:opacity-0 before:-translate-x-4 before:transition-all before:duration-300 before:ease-out",
          "hover:before:translate-x-0 hover:before:opacity-100",
          ((isSearchPage && !categoryFilter) || pathname === "/") &&
            "bg-accent/80 font-medium after:absolute after:bottom-1.5 after:left-0 after:top-1.5 after:w-1 after:rounded-r-full after:bg-[hsl(var(--accent-strong))]",
        )}
        onClick={onNavClick}
      >
        <span className="relative z-10">All Products</span>
      </Link>
      {categories.map((category) => (
        <Link
          key={category._id}
          href={`/search?category=${category.slug}&sort=createdAt&order=desc&page=1&limit=20`}
          className={cn(
            "group relative block overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-300",
            "before:absolute before:inset-0 before:bg-linear-to-r before:from-[hsl(var(--accent-strong))]/25 before:to-transparent before:opacity-0 before:-translate-x-4 before:transition-all before:duration-300 before:ease-out",
            "hover:before:translate-x-0 hover:before:opacity-100",
            isSearchPage && categoryFilter === category.slug &&
              "bg-accent/80 font-medium after:absolute after:bottom-1.5 after:left-0 after:top-1.5 after:w-1 after:rounded-r-full after:bg-[hsl(var(--accent-strong))]",
          )}
          onClick={onNavClick}
        >
          <span className="relative z-10">{category.name}</span>
        </Link>
      ))}
    </nav>
  )
}

function SidebarNavFallback({
  categories,
  onNavClick,
}: {
  categories: Category[]
  onNavClick: () => void
}) {
  return (
    <nav className="space-y-1.5 px-3 pb-4">
      <Link
        href="/search?sort=createdAt&order=desc&page=1&limit=20"
        className={cn(
          "group relative block overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-300",
          "before:absolute before:inset-0 before:bg-linear-to-r before:from-[hsl(var(--accent-strong))]/25 before:to-transparent before:opacity-0 before:-translate-x-4 before:transition-all before:duration-300 before:ease-out",
          "hover:before:translate-x-0 hover:before:opacity-100",
        )}
        onClick={onNavClick}
      >
        <span className="relative z-10">All Products</span>
      </Link>
      {categories.map((category) => (
        <Link
          key={category._id}
          href={`/search?category=${category.slug}&sort=createdAt&order=desc&page=1&limit=20`}
          className={cn(
            "group relative block overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-300",
            "before:absolute before:inset-0 before:bg-linear-to-r before:from-[hsl(var(--accent-strong))]/25 before:to-transparent before:opacity-0 before:-translate-x-4 before:transition-all before:duration-300 before:ease-out",
            "hover:before:translate-x-0 hover:before:opacity-100",
          )}
          onClick={onNavClick}
        >
          <span className="relative z-10">{category.name}</span>
        </Link>
      ))}
    </nav>
  )
}
