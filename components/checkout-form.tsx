"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { fetchBackendUserProfile } from "@/lib/api/user-sync"
import { loadRazorpayScript } from "@/lib/razorpay"
import { useStore } from "@/lib/store"
import { nanoid } from "nanoid"

type RazorpaySuccessPayload = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""

export default function CheckoutForm() {
  const { cartItems, getCartItems, createPaymentOrder, verifyPayment, cancelPaymentIntent } = useStore()
  const { user } = useUser()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    state: "Delhi / New Delhi Only",
    zipCode: "",
    phone: "",
    notes: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitInFlightRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return

    let cancelled = false

    const loadCheckoutProfile = async () => {
      const baseData = {
        name: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }

      try {
        const token = await getToken()

        if (!token) {
          if (!cancelled) {
            setFormData((prev) => ({
              ...prev,
              ...baseData,
            }))
          }
          return
        }

        const backendProfile = await fetchBackendUserProfile(token)

        if (!cancelled) {
          setFormData((prev) => ({
            ...prev,
            ...baseData,
            address: backendProfile.address || "",
            phone: backendProfile.phone || "",
          }))
        }
      } catch {
        if (!cancelled) {
          setFormData((prev) => ({
            ...prev,
            ...baseData,
          }))
        }
      }
    }

    void loadCheckoutProfile()

    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const openRazorpayPopup = async (opts: {
    keyId: string
    amount: number
    currency: string
    razorpayOrderId: string
  }) => {
    if (typeof window === "undefined" || !window.Razorpay) {
      throw new Error("Razorpay SDK is not available")
    }

    const RazorpayCtor = window.Razorpay
    if (!RazorpayCtor) {
      throw new Error("Razorpay SDK is not available")
    }

    return await new Promise<RazorpaySuccessPayload>((resolve, reject) => {
      let settled = false

      const safeResolve = (response: RazorpaySuccessPayload) => {
        if (settled) return
        settled = true
        resolve(response)
      }

      const safeReject = (error: Error) => {
        if (settled) return
        settled = true
        reject(error)
      }

      const instance = new RazorpayCtor({
        key: opts.keyId,
        amount: opts.amount,
        currency: opts.currency,
        name: "Try-On Store",
        description: "Advance payment for your order",
        order_id: opts.razorpayOrderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#111827",
        },
        modal: {
          ondismiss: () => safeReject(new Error("Payment cancelled by user")),
        },
        handler: (response) => {
          safeResolve(response)
        },
      })

      instance.open()
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (submitInFlightRef.current) {
      return
    }

    if (!isSignedIn) {
      toast({
        title: "Login required",
        description: "Please login to proceed to checkout.",
        variant: "destructive",
      })
      router.push("/login?redirect=/checkout")
      return
    }

    setIsSubmitting(true)
    submitInFlightRef.current = true
    let paymentIntentId = ""

    const executeCreatePaymentOrder = async (items: { product: string; size: string; quantity: number }[]) => {
      const buildInitKey = () => `init:${nanoid()}`

      try {
        return await createPaymentOrder({
          items,
          shippingAddress: formData.address,
          notes: formData.notes,
          method: "razorpay",
          idempotencyKey: buildInitKey(),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ""
        const isDuplicate = message.includes("duplicate idempotency")

        if (!isDuplicate) {
          throw error
        }

        // Retry once with a fresh idempotency key in case a stale key reached the API layer.
        return await createPaymentOrder({
          items,
          shippingAddress: formData.address,
          notes: formData.notes,
          method: "razorpay",
          idempotencyKey: buildInitKey(),
        })
      }
    }

    const executeVerifyPayment = async (payload: {
      paymentIntentId: string
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }) => {
      const buildConfirmKey = () => `confirm:${nanoid()}`

      try {
        return await verifyPayment({
          ...payload,
          providerPayload: {
            checkoutSource: "web",
          },
          idempotencyKey: buildConfirmKey(),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ""
        const isDuplicate = message.includes("duplicate idempotency")

        if (!isDuplicate) {
          throw error
        }

        // Retry once with a fresh idempotency key in case a stale key reached the API layer.
        return await verifyPayment({
          ...payload,
          providerPayload: {
            checkoutSource: "web",
          },
          idempotencyKey: buildConfirmKey(),
        })
      }
    }

    try {
      await loadRazorpayScript()

      const items = cartItems.map((item) => ({
        product: item.product,
        size: item.size,
        quantity: item.quantity,
      }))

      const paymentOrder = await executeCreatePaymentOrder(items)

      paymentIntentId = paymentOrder?.paymentIntent?._id || ""
      if (!paymentIntentId) {
        throw new Error("Payment intent was not created")
      }

      const razorpayKey = paymentOrder?.razorpay?.keyId || RAZORPAY_KEY_ID
      if (!razorpayKey) {
        throw new Error("Razorpay key is missing from backend response")
      }

      const razorpayOrderId = paymentOrder?.razorpay?.orderId
      if (!razorpayOrderId) {
        throw new Error("Razorpay order id missing from initiate response")
      }

      const paymentResult = await openRazorpayPopup({
        keyId: razorpayKey,
        amount: paymentOrder.razorpay.amount,
        currency: paymentOrder.razorpay.currency,
        razorpayOrderId,
      })

      const confirmation = await executeVerifyPayment({
        paymentIntentId,
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      })

      const orderId = confirmation?.order?._id
      if (!orderId) {
        throw new Error("Payment confirmed but order id was not returned")
      }

      toast({
        title: "Order placed successfully",
        description: "Payment completed and order confirmed.",
      })

      await getCartItems()
      paymentIntentId = ""
      router.push(`/order-confirmation?orderId=${encodeURIComponent(orderId)}`)
    } catch (error) {
      if (paymentIntentId) {
        try {
          await cancelPaymentIntent({
            paymentIntentId,
            reason: "User cancelled payment or checkout failed",
          })
        } catch {
          // Best effort cleanup only.
        }
      }

      const description = error instanceof Error ? error.message : "Please try again later."
      toast({
        title: "Checkout failed",
        description,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      submitInFlightRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
              </div> */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" value={formData.state} onChange={handleChange} required disabled={true} />
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
              </div> */}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-md border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
              Prepayment is required. You will complete payment securely in Razorpay test mode before your order is placed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Order Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Special instructions for delivery"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting || cartItems.length === 0}>
          {isSubmitting ? "Processing payment..." : "Pay & Place Order"}
        </Button>
      </div>
    </form>
  )
}
