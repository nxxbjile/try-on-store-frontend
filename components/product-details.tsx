"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import type { ProductWithDetails } from "@/lib/api/products"
import TryonButton from "@/components/tryon-button"
import { useStore } from "@/lib/store"

type ProductProps = {
  product: ProductWithDetails
}

export default function ProductDetails({ product }: ProductProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "")
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({})
  const { addToCart } = useStore()
  const { toast } = useToast()

  const galleryImages = product.images?.length ? product.images : ["/placeholder.svg?height=900&width=900"]

  const handleQuantityChange = (value: number) => {
    const newQuantity = quantity + value
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity)
    }
  }

  const isInStock = () => {
    const stockItem = product.stock.find((item) => item.size === selectedSize)
    return Boolean(stockItem && stockItem.quantity > 0)
  }

  const getAvailableQuantity = () => {
    const stockItem = product.stock.find((item) => item.size === selectedSize)
    return stockItem ? stockItem.quantity : 0
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Please select options",
        description: "Please select a size before adding to cart.",
        variant: "destructive",
      })
      return
    }

    if (!isInStock()) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock in the selected size.",
        variant: "destructive",
      })
      return
    }

    addToCart(product._id, selectedSize, quantity)

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const finalPrice = product.discount ? product.price * (1 - product.discount / 100) : product.price

  const handleImageError = (index: number) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }))
  }

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const currentImage = failedImages[activeImage]
    ? "/placeholder.svg?height=900&width=900"
    : galleryImages[activeImage]

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-10">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-[hsl(var(--surface-1))] shadow-sm">
            <div className="relative aspect-square">
              <Image
                src={currentImage || "/placeholder.svg?height=900&width=900"}
                alt={`${product.name} preview ${activeImage + 1}`}
                fill
                className="object-contain p-3"
                onError={() => handleImageError(activeImage)}
                priority
              />
            </div>

            {product.discount ? (
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                {product.discount}% OFF
              </span>
            ) : null}

            {galleryImages.length > 1 ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border border-border/70 bg-background/85"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous image</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border border-border/70 bg-background/85"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next image</span>
                </Button>
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {galleryImages.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={`relative aspect-square overflow-hidden rounded-xl border transition ${
                  activeImage === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/70 hover:border-primary/60"
                }`}
                onClick={() => setActiveImage(index)}
              >
                <Image
                  src={failedImages[index] ? "/placeholder.svg?height=160&width=160" : image || "/placeholder.svg?height=160&width=160"}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full border border-border/70 bg-[hsl(var(--surface-2))]/70 px-2.5 py-1 capitalize">
                {product.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1">
                <Check className="h-3.5 w-3.5 text-primary" />
                Verified quality
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight lg:text-4xl">{product.name}</h1>
            <p className="max-w-xl text-sm text-muted-foreground lg:text-base">{product.description}</p>
          </div>

          <div className="space-y-1 rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/45 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold tracking-tight">{formatPrice(finalPrice)}</span>
              {product.discount ? (
                <span className="pb-1 text-base text-muted-foreground line-through">{formatPrice(product.price)}</span>
              ) : null}
            </div>
            {product.discount ? (
              <p className="text-sm text-primary">You save {formatPrice(product.price - finalPrice)}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">Inclusive of all taxes. Shipping calculated at checkout.</p>
          </div>

          <div className="space-y-4 rounded-xl border border-border/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Size</h3>
                <span className="text-xs text-muted-foreground">Selected: {selectedSize || "None"}</span>
              </div>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <RadioGroupItem value={size} id={`size-${size}`} className="peer sr-only" />
                    <Label
                      htmlFor={`size-${size}`}
                      className="flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md border border-border/80 px-3 text-sm transition hover:border-primary/60 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Quantity</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="inline-flex h-10 min-w-11 items-center justify-center rounded-md border border-border/70 bg-[hsl(var(--surface-2))]/45 px-3 text-sm font-medium">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= Math.min(10, getAvailableQuantity())}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="ml-2 text-xs text-muted-foreground">{getAvailableQuantity()} available</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button className="h-11" onClick={handleAddToCart} disabled={!isInStock()}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isInStock() ? "Add to Cart" : "Out of Stock"}
            </Button>
            <Button variant="outline" className="h-11">
              <Heart className="mr-2 h-4 w-4" />
              Add to Wishlist
            </Button>
          </div>

          <TryonButton productId={product._id} productName={product.name} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 p-3">
              <div className="mb-2 inline-flex rounded-md bg-primary/12 p-2 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">Fast Delivery</p>
              <p className="text-xs text-muted-foreground">Ships in 24-48 hours in major cities.</p>
            </div>
            <div className="rounded-xl border border-border/70 p-3">
              <div className="mb-2 inline-flex rounded-md bg-primary/12 p-2 text-primary">
                <RotateCcw className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">Easy Returns</p>
              <p className="text-xs text-muted-foreground">7-day hassle-free return policy.</p>
            </div>
            <div className="rounded-xl border border-border/70 p-3">
              <div className="mb-2 inline-flex rounded-md bg-primary/12 p-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">Secure Checkout</p>
              <p className="text-xs text-muted-foreground">Encrypted payments and protected orders.</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-0">
          <Card className="rounded-2xl border-border/70">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <h3 className="text-lg font-semibold">About this item</h3>
              <div
                className="prose prose-sm max-w-none text-foreground/90 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: product.details }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shipping" className="mt-0">
          <Card className="rounded-2xl border-border/70">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div>
                <h4 className="font-semibold">Shipping</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Free standard shipping on orders over INR 999. Estimated delivery within 3-5 business days.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Returns</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Return or exchange within 7 days of delivery. Items must be unused and include original tags.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
