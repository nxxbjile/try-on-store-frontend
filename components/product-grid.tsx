"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/lib/api/products"
import { useState } from "react"
import TryonDialog from "@/components/tryon-dialog"
import { useStore } from "@/lib/store"

type ProductGridProps = {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore()
  const { toast } = useToast()
  const [isTryonOpen, setIsTryonOpen] = useState(false)

  const handleAddToCart = () => {
    // Default to first available size and color
    const defaultSize = product.sizes[0] || ""

    addToCart(
      product._id,
      defaultSize,
      1,
    )

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Link href={`/products/${product._id}`}>
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={product.images[0] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
            {product.discount && (
              <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                {product.discount}% OFF
              </span>
            )}
          </div>
        </Link>
        <CardContent className="p-4">
          <Link href={`/products/${product._id}`} className="hover:underline">
            <h3 className="font-medium line-clamp-1">{product.name}</h3>
          </Link>
          <div className="flex items-center mt-1">
            {product.discount ? (
              <>
                <span className="font-bold">{formatPrice(product.price * (1 - product.discount / 100))}</span>
                <span className="text-muted-foreground line-through ml-2 text-sm">{formatPrice(product.price)}</span>
              </>
            ) : (
              <span className="font-bold">{formatPrice(product.price)}</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setIsTryonOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Try On
          </Button>
          <Button variant="secondary" className="flex-1" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add
          </Button>
        </CardFooter>
      </Card>

      <TryonDialog
        isOpen={isTryonOpen}
        onClose={() => setIsTryonOpen(false)}
        productId={product._id}
        productName={product.name}
      />
    </>
  )
}
