"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect } from "react"
import { useStore } from "@/lib/store"
import type { Product } from "@/lib/api/products"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"

const CATEGORIES: Array<{ key: Product["category"]; title: string }> = [
  { key: "shirt", title: "Shirts" },
  { key: "t-shirt", title: "T-Shirts" },
  { key: "pants", title: "Pants" },
]

function ProductMiniCard({ product }: { product: Product }) {
  const discounted = product.discount ? product.price * (1 - product.discount / 100) : product.price

  return (
    <Link
      href={`/products/${product._id}`}
      className="min-w-42.5 max-w-42.5 snap-start sm:min-w-47.5 sm:max-w-47.5"
    >
      <Card className="h-full overflow-hidden border-border/70 bg-card transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-[hsl(var(--surface-2))]/45">
          <Image src={product.images[0] || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          {product.discount ? (
            <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
              {product.discount}% OFF
            </span>
          ) : null}
        </div>
        <CardContent className="space-y-1.5 p-3">
          <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{formatPrice(discounted)}</span>
            {product.discount ? (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function CategoryCarousels() {
  const { products, getProducts } = useStore()

  useEffect(() => {
    if (products.length > 0) return
    void getProducts()
  }, [getProducts, products.length])

  return (
    <div className="space-y-6">
      {CATEGORIES.map((category) => {
        const sectionProducts = products.filter((p) => p.category === category.key).slice(0, 10)

        return (
          <section key={category.key} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold tracking-tight">{category.title}</h3>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/search?category=${encodeURIComponent(category.key)}&sort=createdAt&order=desc&page=1&limit=20`}
                >
                  See All
                </Link>
              </Button>
            </div>

            {sectionProducts.length > 0 ? (
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
                {sectionProducts.map((product) => (
                  <ProductMiniCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No products in this category yet.</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
