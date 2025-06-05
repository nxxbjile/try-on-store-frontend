"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import { useStore } from "@/lib/store"

export default function OrderSummary() {
  const { cartItems, calculateSubtotal, calculateTotal } = useStore()

  const subtotal = calculateSubtotal()
  const shipping = subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.08 // 8% tax
  const total = calculateTotal()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {cartItems.map((item) => {
            const itemPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price
            const totalPrice = itemPrice * item.quantity

            return (
              <div key={`${item.product}-${item.size}`} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                  <span className="text-muted-foreground ml-1">
                    ({item.size})
                  </span>
                </span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            )
          })}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
