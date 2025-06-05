"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import { Order, OrderProduct, OrderStatus } from "./orders-list"

type OrderDetailsDialogProps = {
  order: Order
  isOpen: boolean
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
}

export default function OrderDetailsDialog({ order, isOpen, onClose, onStatusChange }: OrderDetailsDialogProps) {
  const handleStatusChange = (value: string) => {
    onStatusChange(order._id, value as OrderStatus)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-4 sm:p-6">
        <div className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - #{order._id.substring(0, 8)}...</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-medium">Customer Information</h3>
              <p className="text-sm">{order.user.name}</p>
              <p className="text-sm">{order.user.email}</p>
            </div>
            <div>
              <h3 className="font-medium">Shipping Address</h3>
              <p className="text-sm">{order.shippingAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-medium">Order Date</h3>
              <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-medium">Status</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue={order.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-md border mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.products.map((item, index) => {
                  const itemPrice = item.discountAtPurchase
                    ? item.priceAtPurchase * (1 - item.discountAtPurchase / 100)
                    : item.priceAtPurchase
                  const itemTotal = itemPrice * item.quantity

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded overflow-hidden">
                            <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.size}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.discountAtPurchase ? (
                          <div className="flex flex-col items-end">
                            <span>{formatPrice(itemPrice)}</span>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(item.priceAtPurchase)}
                            </span>
                          </div>
                        ) : (
                          formatPrice(item.priceAtPurchase)
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatPrice(itemTotal)}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatPrice(order.totalAmount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
