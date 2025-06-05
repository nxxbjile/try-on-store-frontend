"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

type Category = {
  _id: string
  name: string
  slug: string
  imageUrl: string
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // In a real app, we'd fetch from the API
        // For now, we'll use mock data based on the API docs
        const mockCategories = [
          { _id: "1", name: "Shirts", slug: "shirt", imageUrl: "/placeholder.svg?height=80&width=80" },
          { _id: "2", name: "T-Shirts", slug: "t-shirt", imageUrl: "/placeholder.svg?height=80&width=80" },
          { _id: "3", name: "Pants", slug: "pants", imageUrl: "/placeholder.svg?height=80&width=80" },
          { _id: "4", name: "Jackets", slug: "jackets", imageUrl: "/placeholder.svg?height=80&width=80" },
          { _id: "5", name: "Accessories", slug: "accessories", imageUrl: "/placeholder.svg?height=80&width=80" },
          { _id: "6", name: "Shoes", slug: "shoes", imageUrl: "/placeholder.svg?height=80&width=80" },
        ]
        setCategories(mockCategories)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (isLoading) {
    return null // Skeleton is handled by the parent component
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex space-x-4 pb-4">
        {categories.map((category) => (
          <Link key={category._id} href={`/categories/${category.slug}`} className="flex flex-col items-center">
            <div className="h-24 w-24 rounded-lg bg-secondary flex items-center justify-center mb-2 hover:bg-accent transition-colors">
              <Image
                src={category.imageUrl || "/placeholder.svg"}
                alt={category.name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
            <span className="text-sm font-medium">{category.name}</span>
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
