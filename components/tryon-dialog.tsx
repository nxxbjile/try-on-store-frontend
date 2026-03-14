"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useAuth, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { fetchBackendUserProfile } from "@/lib/api/user-sync"
import { getProduct } from "@/lib/api/products"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { Camera, Loader2, LogIn, RefreshCcw, ShoppingCart, Sparkles } from "lucide-react"

type TryonDialogProps = {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
}

export default function TryonDialog({ isOpen, onClose, productId, productName }: TryonDialogProps) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { generateTryon, getTryonForProduct, isTryonLoading, addToCart, updateUserImage } = useStore()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  const existingTryon = getTryonForProduct(productId)

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleGenerateTryon = async () => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setIsLoginDialogOpen(true)
      return
    }

    const token = await getToken()
    if (!token) {
      setIsLoginDialogOpen(true)
      return
    }

    const backendProfile = await fetchBackendUserProfile(token)
    if (!backendProfile.image) {
      setIsImageDialogOpen(true)
      return
    }

    try {
      const result = await generateTryon(productId)
      if (!result) {
        toast({
          title: "Failed to generate try-on",
          description: "Please try again later.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Try-on generated",
        description: "Your virtual try-on has been created.",
      })
    } catch {
      toast({
        title: "Failed to generate try-on",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleImageUpload = async () => {
    if (!selectedFile) return

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      await updateUserImage(formData)
      setIsImageDialogOpen(false)

      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated successfully.",
      })
    } catch {
      toast({
        title: "Upload failed",
        description: "Failed to upload your image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRedirectToLogin = () => {
    router.push("/login?redirect=/products/" + productId)
    setIsLoginDialogOpen(false)
    onClose()
  }

  const handleAddToCart = async () => {
    try {
      const product = await getProduct(productId)
      if (!product || !product._id) return

      const defaultSize = product.sizes[0] || ""
      await addToCart(product._id, defaultSize, 1)

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })
    } catch {
      toast({
        title: "Failed to add to cart",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 bg-linear-to-b from-[hsl(var(--surface-1))] to-background sm:max-w-3xl">
          <DialogHeader className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/35 p-3 sm:p-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Virtual Try-On
            </DialogTitle>
            <DialogDescription>
              Preview how {productName} looks on you.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-start">
            {isTryonLoading ? (
              <div className="md:col-span-2 flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-linear-to-b from-primary/10 to-[hsl(var(--surface-2))]/40 shadow-sm">
                <Loader2 className="mb-2 h-8 w-8 animate-spin" />
                <p className="text-sm text-muted-foreground">Generating your try-on...</p>
              </div>
            ) : existingTryon ? (
              <>
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-[hsl(var(--surface-1))] shadow-sm ring-1 ring-primary/15">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-primary/12 to-transparent" />
                  <div className="relative aspect-3/4 w-full">
                    <Image
                      src={existingTryon.image || "/placeholder.svg"}
                      alt={`Virtual try-on for ${productName}`}
                      fill
                      className="object-contain p-3"
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-border/80 bg-linear-to-b from-[hsl(var(--surface-2))]/55 to-[hsl(var(--surface-2))]/20 p-4 shadow-sm sm:p-5">
                  <div>
                    <p className="text-sm font-medium">Your Result</p>
                    <p className="text-sm text-muted-foreground">
                      Fit can vary by posture and photo angle. Generate again for another variation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button onClick={handleAddToCart} className="h-11 rounded-xl font-medium shadow-sm cursor-pointer">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerateTryon}
                      className="h-11 w-fit rounded-xl border-border/80 bg-[hsl(var(--surface-1))] font-medium cursor-pointer"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex min-h-88 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-linear-to-b from-primary/8 to-[hsl(var(--surface-2))]/35 px-6 text-center shadow-sm">
                  <div className="mb-4 rounded-full bg-primary/12 p-3 text-primary">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="font-medium">No try-on generated yet</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Generate a virtual try-on to see how this product would look on you before placing your order.
                  </p>
                </div>

                <div className="space-y-4 rounded-2xl border border-border/80 bg-linear-to-b from-[hsl(var(--surface-2))]/55 to-[hsl(var(--surface-2))]/20 p-4 shadow-sm sm:p-5">
                  <Button onClick={handleGenerateTryon} className="h-11 w-full rounded-xl font-medium shadow-sm">
                    Generate Try-On
                  </Button>
                  {!isSignedIn ? (
                    <p className="text-sm text-muted-foreground">Please login to use the try-on feature.</p>
                  ) : user?.fullName ? (
                    <p className="text-sm text-muted-foreground">Signed in as {user.fullName}.</p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 bg-linear-to-b from-[hsl(var(--surface-1))] to-background sm:max-w-lg">
          <DialogHeader className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/35 p-3 sm:p-4">
            <DialogTitle>Upload Your Photo</DialogTitle>
            <DialogDescription>
              Upload a clear front-facing image. We use this profile image to generate accurate try-on previews.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              {previewUrl ? (
                <div className="relative h-40 w-40 overflow-hidden rounded-full border border-primary/30 bg-[hsl(var(--surface-1))] shadow-sm ring-4 ring-primary/8">
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-primary/35 bg-linear-to-b from-primary/8 to-[hsl(var(--surface-2))]/40 shadow-sm">
                  <Camera className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-image">Select Image</Label>
              <Input id="user-image" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImageUpload} disabled={!selectedFile}>
              Upload & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 bg-linear-to-b from-[hsl(var(--surface-1))] to-background sm:max-w-md">
          <DialogHeader className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/35 p-3 sm:p-4">
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>You need to be logged in to use the virtual try-on feature.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-4">
            <LogIn className="h-16 w-16 text-primary" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRedirectToLogin}>Go to Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
