"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import type { ProductWithDetails } from "@/lib/api/products"
import TryonButton from "@/components/tryon-button"
import {useStore} from "@/lib/store"

type ProductProps = {
  product: ProductWithDetails
}

export default function ProductDetails({ product }: ProductProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "")
  // const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || "")
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const { addToCart } = useStore()
  const { toast } = useToast()

  const handleQuantityChange = (value: number) => {
    const newQuantity = quantity + value
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity)
    }
  }

  // Check if the selected size and color combination is in stock
  const isInStock = () => {
    const stockItem = product.stock.find((item) => item.size === selectedSize)
    return stockItem && stockItem.quantity > 0
  }

  // Get available quantity for the selected size and color
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

    addToCart(
      product._id,
      selectedSize,
      quantity
    )

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const finalPrice = product.discount ? product.price * (1 - product.discount / 100) : product.price

  // Get color hex code for display
  // const getColorHex = (colorName: string) => {
  //   const colorMap: Record<string, string> = {
  //     white: "#ffffff",
  //     black: "#000000",
  //     blue: "#3b82f6",
  //     red: "#ef4444",
  //     green: "#22c55e",
  //     yellow: "#eab308",
  //     purple: "#a855f7",
  //     gray: "#6b7280",
  //   }
  //   return colorMap[colorName.toLowerCase()] || "#cccccc"
  // }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <Image
            src={product.images[activeImage] || "/placeholder.svg?height=600&width=600"}
            alt={product.name}
            fill
            className="object-cover"
          />
          {product.discount && (
            <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
              {product.discount}% OFF
            </span>
          )}
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {product.images.map((image, index) => (
            <button
              key={index}
              className={`relative h-20 w-20 rounded-md overflow-hidden border-2 ${
                activeImage === index ? "border-primary" : "border-transparent"
              }`}
              onClick={() => setActiveImage(index)}
            >
              <Image
                src={image || "/placeholder.svg?height=80&width=80"}
                alt={`${product.name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <div className="flex items-center mt-2">
            {product.discount ? (
              <>
                <span className="text-2xl font-bold">{formatPrice(finalPrice)}</span>
                <span className="text-muted-foreground line-through ml-2">{formatPrice(product.price)}</span>
              </>
            ) : (
              <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>

        <p className="text-muted-foreground">{product.description}</p>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Size</h3>
            <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <RadioGroupItem value={size} id={`size-${size}`} className="peer sr-only" />
                  <Label
                    htmlFor={`size-${size}`}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-muted bg-background peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                  >
                    {size}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
              {/* No color options for now */}
          {/* <div>
            <h3 className="font-medium mb-2">Color</h3>
            <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <div key={color} className="flex items-center space-x-2">
                  <RadioGroupItem value={color} id={`color-${color}`} className="peer sr-only" />
                  <Label
                    htmlFor={`color-${color}`}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-muted peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary"
                    style={{ backgroundColor: getColorHex(color) }}
                  >
                    <span className="sr-only">{color}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div> */}

          <div>
            <h3 className="font-medium mb-2">Quantity</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= Math.min(10, getAvailableQuantity())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{getAvailableQuantity()} available</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" onClick={handleAddToCart} disabled={!isInStock()}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isInStock() ? "Add to Cart" : "Out of Stock"}
          </Button>
          <Button variant="outline" className="flex-1">
            <Heart className="mr-2 h-4 w-4" />
            Add to Wishlist
          </Button>
        </div>

        <div className="mt-4">
          <TryonButton productId={product._id} productName={product.name} />
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div dangerouslySetInnerHTML={{ __html: product.details }} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shipping" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h4 className="font-medium">Shipping</h4>
                <p className="text-sm text-muted-foreground">
                  Free standard shipping on orders over $100. Delivery within 3-5 business days.
                </p>
                <h4 className="font-medium mt-4">Returns</h4>
                <p className="text-sm text-muted-foreground">
                  Return or exchange within 30 days of delivery. Items must be unworn and in original packaging.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
