"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import OrderDetailsDialog from "@/components/admin/order-details-dialog"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled"

export type OrderProduct = {
  product: string
  name: string
  image: string
  size: string
  quantity: number
  priceAtPurchase: number
  discountAtPurchase: number
}

export type Order = {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  } | null
  products: OrderProduct[]
  shippingAddress: string
  status: OrderStatus
  notes: string
  createdAt: string
  updatedAt: string
  totalAmount: number
}

const PAGE_SIZE = 20;

export default function OrdersList() {
  const { getOrders, user, hasHydrated, updateOrder } = useStore();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return
    const fetchOrders = async () => {
      if (!user) {
        router.push("/login?redirect=/orders")
        return
      }
      try {
        const fetched = await getOrders({page : 1, limit : PAGE_SIZE})
        console.log("Fetch orders useEffect res : ", fetched);
        if(fetched.total_pages > 1){
          setHasMore(true);
        }
        setPage(1);
        setOrders(fetched.orders)
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [user, router, hasHydrated])
  
  const loadMore = async () => {
    setIsLoading(true)
    try {
      const nextPage = page + 1
      const fetched = await getOrders({ page: nextPage, limit: PAGE_SIZE })
      setOrders(prev => [...prev, ...fetched.orders])
      setHasMore(fetched.orders.length === PAGE_SIZE)
      setPage(nextPage)
    } catch (err) {
      console.error("Error loading more orders:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const res = await updateOrder(orderId, {status:newStatus});
    setOrders(orders.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order)))
    toast({
      title:"Status Changed",
      description:"Status changed Successfully"
    })
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell className="font-medium">{order._id.substring(0, 8)}...</TableCell>
                <TableCell>{order.user?.name || "Unknown User"}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(order.status) + " text-white"}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatPrice(order.totalAmount)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button onClick={loadMore} disabled={isLoading}>
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  )
}

// Mock data for demonstration
// function getMockOrders(): Order[] {
//   return [
//     {
//       _id: "order123456789",
//       user: {
//         _id: "user123",
//         name: "John Doe",
//         email: "john@example.com",
//       },
//       products: [
//         {
//           product: "1",
//           name: "Classic White Shirt",
//           image: "/placeholder.svg",
//           size: "M",
//           color: "white",
//           quantity: 2,
//           priceAtPurchase: 59.99,
//           discountAtPurchase: 0,
//         },
//         {
//           product: "2",
//           name: "Slim Fit Jeans",
//           image: "/placeholder.svg",
//           size: "32",
//           color: "blue",
//           quantity: 1,
//           priceAtPurchase: 79.99,
//           discountAtPurchase: 10,
//         },
//       ],
//       shippingAddress: "123 Main St, Delhi, India",
//       status: "pending",
//       createdAt: "2023-05-15T10:30:00Z",
//       updatedAt: "2023-05-15T10:30:00Z",
//       total: 199.97,
//     },
//     {
//       _id: "order987654321",
//       user: {
//         _id: "user456",
//         name: "Jane Smith",
//         email: "jane@example.com",
//       },
//       products: [
//         {
//           product: "3",
//           name: "Graphic T-Shirt",
//           image: "/placeholder.svg",
//           size: "S",
//           color: "black",
//           quantity: 3,
//           priceAtPurchase: 29.99,
//           discountAtPurchase: 0,
//         },
//       ],
//       shippingAddress: "456 Park Ave, Delhi, India",
//       status: "shipped",
//       createdAt: "2023-05-14T14:20:00Z",
//       updatedAt: "2023-05-16T09:15:00Z",
//       total: 89.97,
//     },
//     {
//       _id: "order567891234",
//       user: {
//         _id: "user789",
//         name: "Robert Johnson",
//         email: "robert@example.com",
//       },
//       products: [
//         {
//           product: "4",
//           name: "Casual Blazer",
//           image: "/placeholder.svg",
//           size: "L",
//           color: "navy",
//           quantity: 1,
//           priceAtPurchase: 129.99,
//           discountAtPurchase: 15,
//         },
//       ],
//       shippingAddress: "789 Broadway, Delhi, India",
//       status: "delivered",
//       createdAt: "2023-05-10T11:45:00Z",
//       updatedAt: "2023-05-13T16:30:00Z",
//       total: 110.49,
//     },
//   ]
// }
