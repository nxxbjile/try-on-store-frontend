"use client"

import type React from "react"

import { ChangeEvent, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import { set } from "react-hook-form"

type AddProductDialogProps = {
  isOpen: boolean
  onClose: () => void
  onAddProduct: (product: any) => void
}

export default function AddProductDialog({ isOpen, onClose, onAddProduct }: AddProductDialogProps) {
  const { toast } = useToast()
  const [productDetails, setProductDetails] = useState({
    name:"",
    description:"",
    category:"",
    price:0,
    discount:0
  }) 
  const [images, setImages] = useState<File[]>([]);
  const [stock, setStock] = useState([{ size: "", quantity: 0}]);
  const [sizes, setSizes] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // const [newColor, setNewColor] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

 
  const handleRemoveImage = (idx: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      // If all images are removed, reset the file input value
      if (updated.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return updated;
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!productDetails.name || !productDetails.category || !productDetails.price) {
        throw new Error("Please fill in all required fields")
      }
     
      // // Create new product object
      // const newProduct = {
      //   name: productDetails.name,
      //   description: productDetails.description,
      //   category: productDetails.category,
      //   price: productDetails.price,
      //   discount: productDetails.discount ? productDetails.discount : 0,
      //   files:images,
      //   sizes,
      //   stock,
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      // }

      let formData = new FormData();

      formData.append("name", productDetails.name);
      formData.append("description", productDetails.description);
      formData.append("category", productDetails.category);
      formData.append("price", productDetails.price.toString());
      formData.append("discount", productDetails.discount.toString());

      // images to formData
      images.forEach((item) => {
        formData.append("files", item);
      })

     // Add sizes as array of strings
      stock.forEach((s, idx) => {
        formData.append(`stock[${idx}][size]`, s.size);
        formData.append(`stock[${idx}][quantity]`, String(s.quantity));
      });


      onAddProduct(formData);
      toast({
        title: "Product added",
        description: `${productDetails.name} has been added successfully.`,
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
  
    if (type === "file" && files) {
      setImages(Array.from(files));
    } else {
      setProductDetails((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  const handleCategoryChange = (value:string) => {
    setProductDetails((prev) => ({...prev, category:value }))
  }

  const handleAddStock = () => {
    setStock((prev) => ([...prev, {size: "", quantity: 0}]));
  }

  const handleRemoveStock = (size:string) => {
    if(stock.length == 1) return;
    const newStock = stock.filter(stock => stock.size !== size);
    setStock(newStock);
  }

  const handleStockChange = (size: string, field: "size" | "quantity", value: string | number) => {
    setStock(prev =>
      prev.map(s =>
        s.size === size
          ? {
              ...s,
              [field]: field === "quantity" ? Number(value) : value
            }
          : s
      )
    );
  };

  useEffect(()=> {
    let sizes:string[] = [];
    stock.forEach((item)=>{
      sizes.push(item.size);
    })

    setSizes(sizes);
    console.log("Sizes array :", sizes);
  },[stock])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg w-[95vw] md:max-w-2xl md:w-full p-0"
        style={{
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <div
          className="overflow-y-auto px-6 pb-6 pt-2"
          style={{ flex: 1, minHeight: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" value={productDetails.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={productDetails.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shirt">Shirt</SelectItem>
                    <SelectItem value="t-shirt">T-Shirt</SelectItem>
                    <SelectItem value="pants">Pants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={productDetails.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            {/* image field  */}
            <div className="space-y-2">
              <Label htmlFor="images">Product Images</Label>
              <Input
                id="images"
                name="images"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                multiple
                onChange={handleChange}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-center bg-muted px-2 py-1 rounded"
                    style={{ minWidth: "100px" }}
                  >
                    <span className="text-xs">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-4 w-4 p-0"
                      onClick={() => handleRemoveImage(idx)}
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productDetails.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={productDetails.discount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex w-full justify-between">
                <Label>Stock - Size : Quantity *</Label>
                <Button type="button" onClick={handleAddStock}>
                    Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {stock.map((stock, idx) => (
                  <div
                    //key={`${stock.size}-${stock.quantity}`}
                    key={idx}
                    className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                  >
                    {/* show 2 input fields for size and quantity */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add size (e.g., S, M, L, XL)"
                        value={stock.size}
                        onChange={(e) => handleStockChange(stock.size, "size", e.target.value)}
                      />
                      <Input
                        placeholder="Add size (e.g., S, M, L, XL)"
                        value={stock.quantity}
                        onChange={(e) => handleStockChange(stock.size, "quantity", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveStock(stock.size)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label>Colors *</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {productDetails.colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                  >
                    <span className="mr-1">{color}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveColor(color)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add color (e.g., white, black, blue)"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                />
                <Button type="button" onClick={handleAddColor}>
                  Add
                </Button>
              </div>
            </div> */}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
