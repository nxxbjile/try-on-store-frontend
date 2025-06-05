import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrderConfirmationPage() {
  // In a real app, we would fetch the order details from the API
  // For now, we'll use mock data
  const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`
  const orderDate = new Date().toLocaleDateString()
  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-center text-muted-foreground">
              Thank you for your purchase. We've received your order and will begin processing it right away.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Order Number:</span>
              <span>{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>{orderDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Estimated Delivery:</span>
              <span>{estimatedDelivery}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation shortly with your order details.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/orders">View My Orders</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
