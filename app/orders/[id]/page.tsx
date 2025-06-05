"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import NoticeBar from "@/components/notice-bar"
import Sidebar from "@/components/sidebar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore } from "@/lib/store"
import { Order, OrderStatus } from "../page"
import { useToast } from "@/hooks/use-toast"

export default function OrderDetailPage () {
  const { user, isAuthLoading: isLoading, hasHydrated, getOrder, updateOrder } = useStore()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderCancelLoading, setOrderCancelLoading] = useState<boolean>(false);
  const params = useParams();
  const { toast } = useToast();

  const handleCancelOder = async () => {
    try{
      setOrderCancelLoading(true);
      const orderCancelled = await updateOrder(params.id as string, {status:"cancelled"});
  
      setOrder((prev) => prev ? { ...prev, status: "cancelled"} : prev);
      toast({
        title:"Order Cancellation",
        description:"Order Cancelled successfully"
      })
    
    }catch(err:any){
      toast({
        title:"Error Order Cancellation",
        description:err.message
      })
    }finally{
      setOrderCancelLoading(false);
    }
  }

   useEffect(() => {
      if (!hasHydrated) return
      const fetchOrders = async () => {
        if (!user) {
          router.push("/login?redirect=/orders")
          return
        }
        setLoading(true)
        try {
          const fetched = await getOrder(params.id as string)
          setOrder(fetched)
        } catch (err) {
          console.error("Error fetching orders:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchOrders()
    }, [user, router, hasHydrated, params.id ])

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-8 w-8 text-yellow-500" />
      case "shipped":
        return <Truck className="h-8 w-8 text-blue-500" />
      case "delivered":
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case "cancelled":
        return <XCircle className="h-8 w-8 text-red-500" />
      default:
        return <Package className="h-8 w-8" />
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "shipped":
        return "bg-blue-500"
      case "delivered":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusDescription = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Your order has been received and is being processed."
      case "shipped":
        return "Your order has been shipped and is on its way to you."
      case "delivered":
        return "Your order has been delivered successfully."
      case "cancelled":
        return "This order has been cancelled."
      default:
        return ""
    }
  }

  if (loading || !order) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Calculate subtotal
  const subtotal = order.products.reduce((total, item) => {
    const itemPrice = item.discountAtPurchase ? item.priceAtPurchase * (1 - item.discountAtPurchase / 100) : item.priceAtPurchase
    return total + itemPrice * item.quantity
  }, 0)

  // Estimate shipping and tax
  const shipping = subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.08 // 8% tax

  return (
    <main className="min-h-screen">
      <NoticeBar />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex relative">
          <Sidebar />
          <div className="flex-1 w-full">
            <div className="mb-6">
              <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link href="/orders">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Orders
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Order #{order._id.substring(0, 8)}</h1>
              <p className="text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center text-center">
                    {getStatusIcon(order.status)}
                    <Badge variant="outline" className={`${getStatusColor(order.status)} text-white mt-3`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <p className="mt-3 text-sm text-muted-foreground">{getStatusDescription(order.status)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.shippingAddress}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Payment Method: Cash</p>
                  {/* <p className="text-sm text-muted-foreground"></p> */}
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.products.map((item, index) => {
                    const itemPrice = item.discountAtPurchase ? item.priceAtPurchase * (1 - item.discountAtPurchase / 100) : item.priceAtPurchase
                    const totalPrice = itemPrice * item.quantity

                    return (
                      <div key={index}>
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                          <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={item.image || "/placeholder.svg?height=80&width=80"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="mt-1">
                              {item.discountAtPurchase ? (
                                <div className="flex items-center">
                                  <span className="font-medium">{formatPrice(itemPrice)}</span>
                                  <span className="text-muted-foreground line-through ml-2 text-sm">
                                    {formatPrice(item.priceAtPurchase)}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-medium">{formatPrice(item.priceAtPurchase)}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{formatPrice(totalPrice)}</span>
                          </div>
                        </div>
                        {index < order.products.length - 1 && <Separator className="my-4" />}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
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
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {order.status === "pending" && (
                  <Button onClick={handleCancelOder} disabled={orderCancelLoading} variant="destructive" size="sm">
                    Cancel Order
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  Need Help?
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

// Mock data for demonstration
function getMockOrders(): Order[] {
  return [
    {
      _id: "order123456789",
      user:"",
      products: [
        {
          product: "1",
          name: "Classic White Shirt",
          image: "/placeholder.svg",
          size: "M",
          quantity: 2,
          priceAtPurchase: 59.99,
        },
        {
          product: "2",
          name: "Slim Fit Jeans",
          image: "/placeholder.svg",
          size: "32",
          quantity: 1,
          priceAtPurchase: 79.99,
          discountAtPurchase: 10,
        },
      ],
      status: "pending",
      totalAmount: 199.97,
      createdAt: "2023-05-15T10:30:00Z",
      updatedAt: "2023-05-15T10:30:00Z",
      shippingAddress: "123 Main St, Delhi, India",
    },
    {
      _id: "order987654321",
      user:"",
      products: [
        {
          product: "3",
          name: "Graphic T-Shirt",
          image: "/placeholder.svg",
          size: "S",
          quantity: 3,
          priceAtPurchase: 29.99,
        },
      ],
      status: "shipped",
      totalAmount: 89.97,
      createdAt: "2023-05-14T14:20:00Z",
      updatedAt: "2023-05-16T09:15:00Z",
      shippingAddress: "456 Park Ave, Delhi, India",
    },
    {
      _id: "order567891234",
      user:"",
      products: [
        {
          product: "4",
          name: "Casual Blazer",
          image: "/placeholder.svg",
          size: "L",
          quantity: 1,
          priceAtPurchase: 129.99,
          discountAtPurchase: 15,
        },
      ],
      status: "delivered",
      totalAmount: 110.49,
      createdAt: "2023-05-10T11:45:00Z",
      updatedAt: "2023-05-13T16:30:00Z",
      shippingAddress: "789 Broadway, Delhi, India",
    },
    {
      _id: "order246813579",
      user:"",
      products: [
        {
          product: "5",
          name: "Summer Dress",
          image: "/placeholder.svg",
          size: "S",
          quantity: 1,
          priceAtPurchase: 89.99,
        },
      ],
      status: "cancelled",
      totalAmount: 89.99,
      createdAt: "2023-05-08T09:20:00Z",
      updatedAt: "2023-05-09T14:10:00Z",
      shippingAddress: "321 Oak St, Delhi, India",
    },
  ]
}
