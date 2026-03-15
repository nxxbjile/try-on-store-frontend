"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { useStore } from "@/lib/store"

type RecommendedProductsProps = {
  currentProductId?: string
  currentCategory?: "shirt" | "t-shirt" | "pants"
}

export default function RecommendedProducts({ currentProductId, currentCategory }: RecommendedProductsProps) {
  const getProducts = useStore((state) => state.getProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [recommended, setRecommended] = useState<any[]>([])

  useEffect(() => {
    let mounted = true

    const fetchRecommendedProducts = async () => {
      setIsLoading(true)
      try {
        const result = await getProducts({
          category: currentCategory,
          page: 1,
          limit: 24,
          sort: "createdAt",
          order: "desc",
        })

        const list = Array.isArray(result?.products) ? result.products : []

        if (mounted) {
          setRecommended(list)
        }
      } catch {
        if (mounted) {
          setRecommended([])
        }
        // Keep section resilient if recommendations fail.
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchRecommendedProducts()

    return () => {
      mounted = false
    }
  }, [currentCategory, currentProductId, getProducts])

  const visibleProducts = useMemo(() => {
    return recommended.filter((p) => p._id !== currentProductId).slice(0, 8)
  }, [currentProductId, recommended])

  return (
    <section className="mt-12 rounded-2xl border border-border/70 bg-[hsl(var(--surface-2))]/35 p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Recommended For You</h2>
          <p className="text-sm text-muted-foreground">Showing products from the same category.</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/products">See All</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading products...</p>
      ) : visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((item) => {
            const discounted = item.discount ? item.price * (1 - item.discount / 100) : item.price
            return (
              <Link
                key={item._id}
                href={`/products/${item._id}`}
                className="group overflow-hidden rounded-xl border border-border/70 bg-background transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <div className="relative aspect-4/5 overflow-hidden bg-[hsl(var(--surface-1))]">
                  <Image
                    src={item.images?.[0] || "/placeholder.svg?height=500&width=400"}
                    alt={item.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  {item.discount ? (
                    <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                      {item.discount}% OFF
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatPrice(discounted)}</span>
                    {item.discount ? (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No products available right now.</p>
      )}
    </section>
  )
}
