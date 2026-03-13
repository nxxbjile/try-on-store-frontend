"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Camera, LogIn } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"

type TryonButtonProps = {
  productId: string
  productName: string
}

export default function TryonButton({ productId, productName }: TryonButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { user, updateUserProfile, generateTryon, getTryonForProduct, isTryonLoading } = useStore()
  const { toast } = useToast()
  const router = useRouter()

  const existingTryon = getTryonForProduct(productId)

  const handleGenerateTryon = async () => {
    if (!user) {
      setIsLoginDialogOpen(true)
      return
    }

    if (!user.image) {
      setIsImageDialogOpen(true)
      return
    }

    try {
      await generateTryon(productId)
      toast({
        title: "Try-on generated",
        description: "Your virtual try-on has been created",
      })
    } catch (error) {
      toast({
        title: "Failed to generate try-on",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!selectedFile || !user) return

    try {
      // In a real app, we would upload the file to a server
      // For now, we'll simulate a successful upload
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update user profile with new image URL
      await updateUserProfile({
        image: previewUrl,
      })

      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated successfully.",
      })
      setIsImageDialogOpen(false)

      // Now generate the try-on
      await generateTryon(productId)
    } catch (error) {
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
    setIsOpen(false)
  }

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setIsOpen(true)}>
        Virtual Try-On
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Virtual Try-On</DialogTitle>
            <DialogDescription>See how {productName} looks on you with our virtual try-on feature.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4">
            {isTryonLoading ? (
              <div className="flex flex-col items-center justify-center h-100">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Generating your try-on...</p>
              </div>
            ) : existingTryon ? (
              <div className="relative h-100 w-full">
                <Image
                  src={existingTryon.image || "/placeholder.svg"}
                  alt={`Virtual try-on for ${productName}`}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <p className="text-center text-muted-foreground">
                  Generate a virtual try-on to see how this product would look on you.
                </p>
                <Button onClick={handleGenerateTryon} disabled={isTryonLoading}>
                  Generate Try-On
                </Button>
                {!user && <p className="text-sm text-muted-foreground">Please login to use the try-on feature.</p>}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Your Photo</DialogTitle>
            <DialogDescription>
              We need a photo of you to generate a virtual try-on. This will be saved to your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              {previewUrl ? (
                <div className="relative h-40 w-40 rounded-full overflow-hidden">
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="h-40 w-40 rounded-full bg-muted flex items-center justify-center">
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

      {/* Login Redirect Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
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
