"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  const { isSidebarOpen, closeSidebar } = useStore()

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
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [closeSidebar])

  return (
    <div
      className={cn(
        "bg-card rounded-lg p-4 transition-all duration-300 ease-in-out",
        "fixed md:sticky top-16 h-[calc(100vh-4rem)] z-40 w-64",
        "md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Categories</h2>
        <Button variant="ghost" size="sm" className="md:hidden" onClick={closeSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <nav className="space-y-1">
        <Link
          href="/products"
          className={cn(
            "block px-3 py-2 rounded-md hover:bg-accent transition-colors",
            pathname === "/products" && "bg-accent font-medium",
          )}
          onClick={() => closeSidebar()}
        >
          All Products
        </Link>
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/categories/${category.slug}`}
            className={cn(
              "block px-3 py-2 rounded-md hover:bg-accent transition-colors",
              pathname === `/categories/${category.slug}` && "bg-accent font-medium",
            )}
            onClick={() => closeSidebar()}
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
