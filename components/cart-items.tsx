"use client"

import Image from "next/image"
import Link from "next/link"
import { Trash2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useEffect } from "react"

export default function CartItems() {
  const { cartItems, addToCart, removeFromCart, removeProductFromCart, getCartItems } = useStore()
  useEffect(()=>{
    const getCart = async ()=>{
      try {
        await getCartItems()
      } catch {
        // Errors are handled in store/UI flows.
      }
    }
    void getCart()
  }, [getCartItems])

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {cartItems.map((item) => {
        const itemPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price
        const totalPrice = itemPrice * item.quantity

        return (
          <div
            key={`${item.product}-${item.size}`}
            className="flex flex-col sm:flex-row gap-4 border-b pb-6"
          >
            <div className="relative h-24 w-24 rounded-md overflow-hidden shrink-0">
              <Image
                src={item.images[0] || "/placeholder.svg?height=96&width=96"}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 space-y-1">
              <Link href={`/products/${item.product}`} className="font-medium hover:underline">
                {item.name}
              </Link>

              <div className="text-sm text-muted-foreground">
                <span>Size: {item.size}</span>
                <span className="mx-2">•</span>
              </div>

              <div className="flex items-center mt-2">
                {item.discount ? (
                  <>
                    <span className="font-medium">{formatPrice(itemPrice)}</span>
                    <span className="text-muted-foreground line-through ml-2 text-sm">{formatPrice(item.price)}</span>
                  </>
                ) : (
                  <span className="font-medium">{formatPrice(item.price)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFromCart(item.product, item.size, 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => addToCart(item.product, item.size, 1)}
                  disabled={item.quantity >= 10}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right min-w-20">
                <div className="font-medium">{formatPrice(totalPrice)}</div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeProductFromCart(item.product, item.size)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
