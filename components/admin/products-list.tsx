"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import AddProductDialog from "@/components/admin/add-product-dialog"
import { PlusCircle } from "lucide-react"
import { useStore } from "@/lib/store"
import { Product } from "@/lib/api/products"
import EditProductDialog from "./edit-product-dialog"

const PAGE_SIZE = 20;
export default function ProductsList() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const {hasHydrated, getProducts, products, createProduct, deleteProduct:delProductStore } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // In ProductsList
useEffect(() => {
  if (!hasHydrated) return
  setIsLoading(true)
  const fetchProducts = async () => {
    try {
      const fetched = await getProducts({limit: PAGE_SIZE});
      setHasMore(fetched.products.length === PAGE_SIZE)
    } catch (err) {
      console.error("Error fetching Products:", err)
    } finally {
      setIsLoading(false)
    }
  }
  fetchProducts()
}, [hasHydrated])

const handleEditClick = (product: Product) => {
  setEditProduct(product);
  setIsEditDialogOpen(true);
};

const handleEditProduct = async (updatedProduct: Product) => {
  // Call your updateProduct API/store here
  // await updateProduct(updatedProduct._id, updatedProduct);
  setIsEditDialogOpen(false);
  setEditProduct(null);
  // Optionally refetch products
  getProducts({page, limit:PAGE_SIZE});
};

const handleDeleteClick = (product: Product) => {
  setDeleteProduct(product);
  setIsDeleteDialogOpen(true);
};

const handleDeleteProduct = async () => {
  if (deleteProduct) {
    // Call your deleteProduct API/store here
    await delProductStore(deleteProduct._id as string);
    // await deleteProduct(deleteProduct._id);
    setIsDeleteDialogOpen(false);
    setDeleteProduct(null);
    getProducts({page, limit:PAGE_SIZE});
    // Optionally refetch products
  }
};

const handleAddProduct = (formData: Product) => {
  // todo : handle create product
  try{
    const res = createProduct(formData);  
    if(res){
      console.log("handleAddProduct Res:", res);
    }
  }catch(err){
    console.error("Unable to create Product: ", err);
  }
  
}
const loadMore = async () => {
  setIsLoading(true)
  try {
    const nextPage = page + 1
    const fetched = await getProducts({page: nextPage, limit: PAGE_SIZE})
    setHasMore(fetched.products.length === PAGE_SIZE)
    setPage(nextPage);
  } catch (err) {
    console.error("Error loading more products:", err)
  } finally {
    setIsLoading(false)
  }
}

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Products</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const totalStock = product.stock?.reduce((sum, item) => sum + item.quantity, 0)
              return (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative min-h-10 min-w-10 rounded overflow-hidden">
                        <Image
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.discount ? (
                      <div className="flex flex-col">
                        <span>{formatPrice(product.price * (1 - product.discount / 100))}</span>
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
                      </div>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={totalStock > 0 ? "outline" : "destructive"}>
                      {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right gap-2 flex justify-end">
                    <Button onClick={()=>handleEditClick(product)} variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button onClick={()=> handleDeleteClick(product)} variant="destructive" size="sm">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
          {hasMore && (<div className="flex justify-center py-4">
            <Button onClick={loadMore} disabled={isLoading}>
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>)}
      </div>

      <AddProductDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Edit Product Dialog */}
      {editProduct && (
        <EditProductDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditProduct(null);
          }}
          onEditProduct={handleEditProduct}
          initialProduct={editProduct} // You need to support this prop in AddProductDialog
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deleteProduct?.name}</span>?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Mock data for demonstration
// function getMockProducts(): Product[] {
//   return [
//     {
//       _id: "1",
//       name: "Classic White Shirt",
//       description: "A timeless white shirt that goes with everything.",
//       category: "shirt",
//       price: 59.99,
//       images: ["/placeholder.svg"],
//       sizes: ["S", "M", "L", "XL"],
//       colors: ["white", "blue"],
//       stock: [
//         { size: "S", color: "white", quantity: 10 },
//         { size: "M", color: "white", quantity: 15 },
//         { size: "L", color: "white", quantity: 12 },
//         { size: "XL", color: "white", quantity: 8 },
//         { size: "S", color: "blue", quantity: 5 },
//         { size: "M", color: "blue", quantity: 10 },
//         { size: "L", color: "blue", quantity: 8 },
//         { size: "XL", color: "blue", quantity: 6 },
//       ],
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     },
//     {
//       _id: "2",
//       name: "Slim Fit Jeans",
//       description: "Modern slim fit jeans with a comfortable stretch.",
//       category: "pants",
//       price: 79.99,
//       discount: 10,
//       images: ["/placeholder.svg"],
//       sizes: ["30", "32", "34", "36"],
//       colors: ["blue", "black"],
//       stock: [
//         { size: "30", color: "blue", quantity: 8 },
//         { size: "32", color: "blue", quantity: 12 },
//         { size: "34", color: "blue", quantity: 10 },
//         { size: "36", color: "blue", quantity: 6 },
//         { size: "30", color: "black", quantity: 7 },
//         { size: "32", color: "black", quantity: 14 },
//         { size: "34", color: "black", quantity: 9 },
//         { size: "36", color: "black", quantity: 5 },
//       ],
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     },
//     {
//       _id: "3",
//       name: "Graphic T-Shirt",
//       description: "Comfortable cotton t-shirt with graphic print.",
//       category: "t-shirt",
//       price: 29.99,
//       images: ["/placeholder.svg"],
//       sizes: ["S", "M", "L", "XL"],
//       colors: ["black", "white", "gray"],
//       stock: [
//         { size: "S", color: "black", quantity: 20 },
//         { size: "M", color: "black", quantity: 25 },
//         { size: "L", color: "black", quantity: 15 },
//         { size: "XL", color: "black", quantity: 10 },
//         { size: "S", color: "white", quantity: 18 },
//         { size: "M", color: "white", quantity: 22 },
//         { size: "L", color: "white", quantity: 12 },
//         { size: "XL", color: "white", quantity: 8 },
//         { size: "S", color: "gray", quantity: 15 },
//         { size: "M", color: "gray", quantity: 20 },
//         { size: "L", color: "gray", quantity: 10 },
//         { size: "XL", color: "gray", quantity: 5 },
//       ],
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     },
//   ]
// }
