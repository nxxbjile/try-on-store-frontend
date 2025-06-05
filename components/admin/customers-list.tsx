"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, UserPlus } from "lucide-react"
import { useStore } from "@/lib/store"

type Customer = {
  _id: string
  name: string
  email: string
  phone?: string
  address?: string
  role: string
  createdAt: string
  image?: string
}

type CustomersListProps = {
  limit?: number
}

const PAGE_SIZE = 20;
export default function CustomersList({ limit }: CustomersListProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const {hasHydrated, getUsers} = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);


  useEffect(()=>{
    if(!hasHydrated) return;

    // fetch and set the users as customers
    const fetchUsers = async () => {
      const res = await getUsers({limit: PAGE_SIZE});
      setCustomers(res.users);
    }

    fetchUsers();

  },[hasHydrated])

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const loadMore = async () => {
    setIsLoading(true)
    try {
      const nextPage = page + 1
      const fetched = await getUsers({ page: nextPage, limit: PAGE_SIZE })
      setCustomers(prev => [...prev, ...fetched.users])
      setHasMore(fetched.users.length === PAGE_SIZE)
      setPage(nextPage)
    } catch (err) {
      console.error("Error loading more Users:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      // You can search by name or email, or both
      const params: Record<string, string | number> = { limit: PAGE_SIZE }
      if (searchQuery) {
        params.search = searchQuery;
        // Or, if your backend supports a generic search param, use: params.search = searchQuery
      }
      const res = await getUsers(params)
      setCustomers(res.users)
      setPage(1)
      setHasMore(res.users.length === PAGE_SIZE)
    } catch (err) {
      console.error("Error searching users:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <CardTitle>Customers</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch()}}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          {!limit && (
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                {/* <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead> */}
                <TableHead>Role</TableHead>
                {!limit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={customer.image || "/placeholder.svg"} alt={customer.name} />
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <Badge variant={customer.status === "active" ? "outline" : "secondary"}>
                      {customer.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell> */}
                  {/* <TableCell>{customer.totalOrders}</TableCell>
                  <TableCell>${customer.totalSpent.toFixed(2)}</TableCell> */}
                  <TableCell>
                    <Badge variant={customer.role === "admin" ? "default" : "secondary"}>
                      {customer.role}
                    </Badge>
                  </TableCell>
                  {!limit && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(customer)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={limit ? 4 : 5} className="h-24 text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
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
      </CardContent>
      {/* Dialog for customer details */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg mx-2 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogClose />
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedCustomer.image || "/placeholder.svg"} alt={selectedCustomer.name} />
                  <AvatarFallback>{selectedCustomer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedCustomer.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedCustomer.email}</div>
                </div>
              </div>
              <div><strong>Role:</strong> {selectedCustomer.role}</div>
              {selectedCustomer.phone && <div><strong>Phone:</strong> {selectedCustomer.phone}</div>}
              {selectedCustomer.address && <div><strong>Address:</strong> {selectedCustomer.address}</div>}
              <div><strong>Joined:</strong> {new Date(selectedCustomer.createdAt).toLocaleDateString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Mock data for demonstration
// function getMockCustomers(): Customer[] {
//   return [
//     {
//       _id: "cust1",
//       name: "John Doe",
//       email: "john@example.com",
//       phone: "555-123-4567",
//       address: "123 Main St, Delhi, India",
//       role:"user",
//       createdAt: "2023-01-15T10:30:00Z",
//     },
//     {
//       _id: "cust2",
//       name: "Jane Smith",
//       email: "jane@example.com",
//       phone: "555-987-6543",
//       address: "456 Park Ave, Delhi, India",
//       role:"user",
//       createdAt: "2023-02-20T14:20:00Z",
//     },
//     {
//       _id: "cust3",
//       name: "Robert Johnson",
//       email: "robert@example.com",
//       phone: "555-456-7890",
//       address: "789 Broadway, Delhi, India",
//       role:"user",
//       createdAt: "2023-03-10T11:45:00Z",
//     },
//     {
//       _id: "cust4",
//       name: "Emily Davis",
//       email: "emily@example.com",
//       phone: "555-789-0123",
//       address: "321 Oak St, Delhi, India",
//       totalOrders: 8,
//       totalSpent: 789.92,
//       status: "active",
//       createdAt: "2023-01-05T09:20:00Z",
//     },
//     {
//       _id: "cust5",
//       name: "Michael Wilson",
//       email: "michael@example.com",
//       phone: "555-321-6547",
//       address: "654 Pine St, Delhi, India",
//       totalOrders: 2,
//       totalSpent: 159.98,
//       status: "active",
//       createdAt: "2023-04-12T16:30:00Z",
//     },
//   ]
// }
