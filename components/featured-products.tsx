"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { getProducts, type Product } from "@/lib/api/products"
import TryonDialog from "./tryon-dialog"
import { useStore } from "@/lib/store"

export default function FeaturedProducts() {
  const {products, getProducts, replaceProductImagesWithTryOns} = useStore();
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isTryonOpen, setIsTryonOpen] = useState(false)

  useEffect(() => {
    setIsLoading(true);
    getProducts();
    replaceProductImagesWithTryOns();
    setIsLoading(false);
  }, [])

  const handleTryVirtually = (product: Product) => {
    setSelectedProduct(product)
    setIsTryonOpen(true)
  }

  if (isLoading) {
    return null // Skeleton is handled by the parent component
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {products.map((product) => (
          <Card key={product._id} className="overflow-hidden">
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
                    <span className="text-muted-foreground line-through ml-2 text-sm">
                      {formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="font-bold">{formatPrice(product.price)}</span>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="secondary" className="w-full" onClick={() => handleTryVirtually(product)}>
                <Eye className="h-4 w-4 mr-2" />
                Try Virtually
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedProduct && selectedProduct._id && (
        <TryonDialog
          isOpen={isTryonOpen}
          onClose={() => setIsTryonOpen(false)}
          productId={selectedProduct._id}
          productName={selectedProduct.name}
        />
      )}
    </>
  )
}
