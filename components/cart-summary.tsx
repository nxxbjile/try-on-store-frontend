"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { useStore } from "@/lib/store"

export default function CartSummary() {
  const [isProcessing, setIsProcessing] = useState(false)
  const { cartItems, calculatePricingBreakdown } = useStore()
  const { isLoaded, isSignedIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleCheckout = () => {
    if (!isLoaded || !isSignedIn) {
      toast({
        title: "Login required",
        description: "Please login to proceed to checkout.",
        variant: "destructive",
      })
      router.push("/login?redirect=/checkout")
      return
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Add some items before checkout.",
        variant: "destructive",
      })
      return
    }

    router.push("/checkout")
  }

  const { subtotal, shipping, tax, total } = calculatePricingBreakdown()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleCheckout} disabled={!isLoaded || isProcessing || cartItems.length === 0}>
          {isProcessing ? "Processing..." : "Proceed to Checkout"}
        </Button>
      </CardFooter>
    </Card>
  )
}
