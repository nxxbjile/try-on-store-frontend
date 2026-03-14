"use client"

import type React from "react"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { UploadCloud, X } from "lucide-react"

type ProductStockRow = {
  size: string
  quantity: number
}

export type AddProductPayload = {
  product: {
    name: string
    description: string
    category: "shirt" | "t-shirt" | "pants"
    price: number
    discount: number
    sizes: string[]
    stock: ProductStockRow[]
  }
  mainImageFile: File | null
  galleryImageFiles: File[]
}

type AddProductDialogProps = {
  isOpen: boolean
  onClose: () => void
  onAddProduct: (payload: AddProductPayload) => Promise<void> | void
}

export default function AddProductDialog({ isOpen, onClose, onAddProduct }: AddProductDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    category: "" as "" | "shirt" | "t-shirt" | "pants",
    price: 0,
    discount: 0,
  })

  const [stock, setStock] = useState<ProductStockRow[]>([{ size: "", quantity: 0 }])
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([])

  const mainImageInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const mainImagePreview = useMemo(() => {
    if (!mainImageFile) return null
    return URL.createObjectURL(mainImageFile)
  }, [mainImageFile])

  const galleryPreviews = useMemo(
    () => galleryImageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [galleryImageFiles],
  )

  useEffect(() => {
    return () => {
      if (mainImagePreview) URL.revokeObjectURL(mainImagePreview)
      galleryPreviews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [galleryPreviews, mainImagePreview])

  const resetForm = () => {
    setProductDetails({
      name: "",
      description: "",
      category: "",
      price: 0,
      discount: 0,
    })
    setStock([{ size: "", quantity: 0 }])
    setMainImageFile(null)
    setGalleryImageFiles([])
    if (mainImageInputRef.current) mainImageInputRef.current.value = ""
    if (galleryInputRef.current) galleryInputRef.current.value = ""
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setMainImageFile(file)
  }

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setGalleryImageFiles((prev) => [...prev, ...files])
  }

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index))
    if (galleryImageInputRefShouldReset(index, galleryImageFiles.length) && galleryInputRef.current) {
      galleryInputRef.current.value = ""
    }
  }

  const galleryImageInputRefShouldReset = (index: number, length: number) => {
    return length <= 1 || index === 0
  }

  const handleAddStockRow = () => {
    setStock((prev) => [...prev, { size: "", quantity: 0 }])
  }

  const handleRemoveStockRow = (index: number) => {
    setStock((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const handleStockChange = (index: number, field: "size" | "quantity", value: string) => {
    setStock((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: field === "quantity" ? Number(value || 0) : value,
            }
          : row,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!productDetails.name || !productDetails.category || !productDetails.price) {
        throw new Error("Please fill in all required fields")
      }

      const normalizedStock = stock
        .filter((row) => row.size.trim())
        .map((row) => ({ size: row.size.trim(), quantity: Number(row.quantity) || 0 }))

      if (normalizedStock.length === 0) {
        throw new Error("Please add at least one valid stock row")
      }

      const payload: AddProductPayload = {
        product: {
          name: productDetails.name.trim(),
          description: productDetails.description.trim(),
          category: productDetails.category,
          price: Number(productDetails.price),
          discount: Number(productDetails.discount) || 0,
          sizes: normalizedStock.map((row) => row.size),
          stock: normalizedStock,
        },
        mainImageFile,
        galleryImageFiles,
      }

      await onAddProduct(payload)

      toast({
        title: "Product added",
        description: `${productDetails.name} has been added successfully.`,
      })
      handleClose()
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[88vh] w-[95vw] max-w-3xl flex-col overflow-hidden border-border/70 bg-linear-to-b from-[hsl(var(--surface-1))] to-background p-0">
        <DialogHeader className="border-b border-border/70 bg-[hsl(var(--surface-2))]/45 px-6 py-4">
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 space-y-6 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/30 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={productDetails.name}
                  onChange={(e) => setProductDetails((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={productDetails.category}
                  onValueChange={(value: "shirt" | "t-shirt" | "pants") =>
                    setProductDetails((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="category">
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

            <div className="space-y-2 rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/30 p-4">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={productDetails.description}
                onChange={(e) => setProductDetails((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/30 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productDetails.price}
                  onChange={(e) => setProductDetails((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={productDetails.discount}
                  onChange={(e) => setProductDetails((prev) => ({ ...prev, discount: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/70 bg-linear-to-b from-primary/8 to-[hsl(var(--surface-2))]/25 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Main Image</Label>
                {mainImageFile ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setMainImageFile(null)}>
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                ) : null}
              </div>

              <Input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageChange} />

              <div className="relative aspect-square max-w-55 overflow-hidden rounded-xl border border-border/70 bg-[hsl(var(--surface-1))]">
                {mainImagePreview ? (
                  <Image src={mainImagePreview} alt="Main image preview" fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/70 bg-linear-to-b from-primary/8 to-[hsl(var(--surface-2))]/25 p-4 shadow-sm">
              <Label className="text-sm font-semibold">Gallery Images</Label>
              <Input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryImagesChange} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {galleryPreviews.map((item, index) => (
                  <div key={`${item.file.name}-${index}`} className="group relative overflow-hidden rounded-xl border border-border/70">
                    <div className="relative aspect-square bg-[hsl(var(--surface-1))]">
                      <Image src={item.url} alt={`Gallery preview ${index + 1}`} fill className="object-cover" />
                    </div>
                    <button
                      type="button"
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
                      onClick={() => handleRemoveGalleryImage(index)}
                      aria-label="Remove gallery image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/30 p-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Stock (Size and Quantity)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddStockRow}>
                  Add Row
                </Button>
              </div>

              <div className="space-y-2">
                {stock.map((row, index) => (
                  <div key={index} className="grid grid-cols-[1fr_120px_auto] gap-2">
                    <Input
                      placeholder="Size (S, M, L, XL)"
                      value={row.size}
                      onChange={(e) => handleStockChange(index, "size", e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Quantity"
                      value={row.quantity}
                      onChange={(e) => handleStockChange(index, "quantity", e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStockRow(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 border-t border-border/70 px-6 py-4 sm:gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
