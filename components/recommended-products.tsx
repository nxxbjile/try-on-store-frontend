"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { useStore } from "@/lib/store"

type RecommendedProductsProps = {
  currentProductId?: string
}

export default function RecommendedProducts({ currentProductId }: RecommendedProductsProps) {
  const products = useStore((state) => state.products)
  const getProducts = useStore((state) => state.getProducts)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const hydrateProducts = async () => {
      if (products.length > 0) return
      setIsLoading(true)
      try {
        await getProducts()
      } catch {
        // Keep section resilient if recommendations fail.
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void hydrateProducts()

    return () => {
      mounted = false
    }
  }, [getProducts, products.length])

  const visibleProducts = useMemo(() => {
    return products.filter((p) => p._id !== currentProductId).slice(0, 4)
  }, [currentProductId, products])

  return (
    <section className="mt-12 rounded-2xl border border-border/70 bg-[hsl(var(--surface-2))]/35 p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Recommended For You</h2>
          <p className="text-sm text-muted-foreground">Showing normal products from your store list.</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/products">See All</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading products...</p>
      ) : visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-1.5 p-3.5">
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
