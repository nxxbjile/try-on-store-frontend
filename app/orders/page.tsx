"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import Header from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import NoticeBar from "@/components/notice-bar"
import Sidebar from "@/components/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ChevronRight, Package } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/store"

export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled"

export type OrderProduct = {
  product: string
  name: string
  image: string
  size: string
  quantity: number
  priceAtPurchase: number
  discountAtPurchase?: number
}

export type Order = {
  _id: string
  user:any
  products: OrderProduct[]
  status: OrderStatus
  totalAmount: number
  createdAt: string
  updatedAt: string
  notes?: string
  shippingAddress: string
}

export default function OrdersPage() {
  const { getOrders } = useStore();
  const { isLoaded, isSignedIn } = useAuth()
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")

  useEffect(() => {
    if (!isLoaded) return

    const fetchOrders = async () => {
      if (!isSignedIn) {
        setIsLoading(false)
        return
      }

      try {
        const fetched = await getOrders()
        setOrders(fetched.orders)
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchOrders()
  }, [getOrders, isLoaded, isSignedIn])
  

  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

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

  if (isLoading) {
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

  return (
    <main className="min-h-screen">
      <NoticeBar />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex relative">
          <Sidebar />
          <div className="flex-1 w-full">
            <Card>
              <CardHeader>
                <CardTitle>My Orders</CardTitle>
                <CardDescription>View and track your order history</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="all">All Orders</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="shipped">Shipped</TabsTrigger>
                    <TabsTrigger value="delivered">Delivered</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab}>
                    {filteredOrders.length > 0 ? (
                      <div className="space-y-6">
                        {filteredOrders.map((order) => (
                          <Card key={order._id}>
                            <CardHeader className="pb-2">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                  <CardTitle className="text-base">Order #{order._id.substring(0, 8)}</CardTitle>
                                  <CardDescription>
                                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`${getStatusColor(order.status)} text-white mt-2 md:mt-0`}
                                >
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Items</h4>
                                    <div className="space-y-2">
                                      {order.products.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                            <Package className="h-5 w-5" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            {/* <p className="text-xs text-muted-foreground">
                                              {item.size}, {item.color} × {item.quantity}
                                            </p> */}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Shipping Address</h4>
                                    <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Order Total</h4>
                                    <p className="text-lg font-bold">{formatPrice(order.totalAmount)}</p>
                                  </div>
                                </div>
                                <Separator />
                                <div className="flex justify-end">
                                  <Link href={`/orders/${order._id}`} passHref>
                                    <Button variant="outline" size="sm" className="gap-1">
                                      View Details
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No orders found</h3>
                        <p className="text-muted-foreground mb-6">
                          {activeTab === "all"
                            ? "You haven't placed any orders yet."
                            : `You don't have any ${activeTab} orders.`}
                        </p>
                        <Button asChild>
                          <Link href="/products">Continue Shopping</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
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
