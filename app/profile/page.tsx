"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth, useUser } from "@clerk/nextjs"
import { fetchBackendUserProfile, syncBackendUserProfile } from "@/lib/api/user-sync"
import { useStore } from "@/lib/store"
import Header from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, ChevronRight, Mail, MapPin, Package, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import NoticeBar from "@/components/notice-bar"
import Sidebar from "@/components/sidebar"
import { formatPrice } from "@/lib/utils"

type ProfileOrder = {
  _id: string
  status: "pending" | "shipped" | "delivered" | "cancelled"
  totalAmount: number
  createdAt: string
  products: Array<{
    quantity: number
    name?: string
  }>
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { getToken, isSignedIn } = useAuth()
  const { updateUserImage, getOrders } = useStore()
  const { toast } = useToast()
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    image: "",
    address: "",
    phone: "",
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [orders, setOrders] = useState<ProfileOrder[]>([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    let isCancelled = false

    const loadProfile = async () => {
      // Name/email come from Clerk identity.
      const baseProfile = {
        name: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }

      try {
        const token = await getToken()

        if (!token) {
          if (!isCancelled) {
            setProfileData({
              ...baseProfile,
              image: "",
              address: "",
              phone: "",
            })
          }
          return
        }

        const backendProfile = await fetchBackendUserProfile(token)

        if (!isCancelled) {
          setProfileData({
            ...baseProfile,
            image: backendProfile.image || "",
            address: backendProfile.address || "",
            phone: backendProfile.phone || "",
          })
        }
      } catch {
        if (!isCancelled) {
          setProfileData({
            ...baseProfile,
            image: "",
            address: "",
            phone: "",
          })
          toast({
            title: "Profile sync warning",
            description: "Could not load address and phone from backend.",
            variant: "destructive",
          })
        }
      }
    }

    void loadProfile()

    return () => {
      isCancelled = true
    }
  }, [getToken, toast, user])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    let cancelled = false

    const loadOrders = async () => {
      setIsOrdersLoading(true)
      try {
        const res = await getOrders()
        if (!cancelled) {
          setOrders(Array.isArray(res?.orders) ? res.orders : [])
        }
      } catch {
        if (!cancelled) {
          setOrders([])
        }
      } finally {
        if (!cancelled) {
          setIsOrdersLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      cancelled = true
    }
  }, [getOrders, isLoaded, isSignedIn])

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUpdating(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error("Authentication required")
      }

      const [firstName, ...rest] = profileData.name.trim().split(" ")
      const lastName = rest.join(" ").trim() || null

      await user.update({
        firstName,
        lastName,
      })

      await syncBackendUserProfile(token, {
        name: profileData.name,
        email: profileData.email,
        image: profileData.image,
        address: profileData.address,
        phone: profileData.phone,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }

      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleImageUpload = async () => {
    if (!selectedFile) return

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const uploadedUrl = await updateUserImage(formData)
      if (uploadedUrl) {
        setProfileData((prev) => ({ ...prev, image: uploadedUrl }))
      }

      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated successfully.",
      })
      setIsImageDialogOpen(false)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload your image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: ProfileOrder["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-500"
      case "shipped":
        return "bg-blue-500"
      case "delivered":
        return "bg-emerald-500"
      case "cancelled":
        return "bg-rose-500"
      default:
        return "bg-muted"
    }
  }

  if (!isLoaded || !user) {
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
    <main className="min-h-screen bg-[hsl(var(--surface-1))]">
      <NoticeBar />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex relative">
          <Sidebar />
          <div className="w-full flex-1">
            <div className="space-y-6">
              <Card className="overflow-hidden border-border/70 bg-linear-to-br from-[hsl(var(--surface-2))] to-background shadow-sm">
                <CardHeader className="relative pb-5">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-primary/10 to-transparent" />
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-5 w-5 text-primary" />
                        My Profile
                      </CardTitle>
                      <CardDescription>Manage your account details, photo, and contact information.</CardDescription>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-22 w-22 border border-border/70 shadow-sm">
                          <AvatarImage src={profileData.image || "/placeholder.svg"} alt={user.fullName || "User"} />
                          <AvatarFallback>{(user.fullName || "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button
                          size="icon"
                          className="absolute bottom-0 right-0 h-7 w-7 rounded-full"
                          onClick={() => setIsImageDialogOpen(true)}
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/55 p-3">
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="line-clamp-1 text-sm font-medium">{profileData.name || "Not set"}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/55 p-3">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="line-clamp-1 text-sm font-medium">{profileData.email || "Not set"}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/55 p-3">
                      <p className="text-xs text-muted-foreground">Member Status</p>
                      <p className="text-sm font-medium">Active</p>
                    </div>
                  </div>

                </CardHeader>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                <Card className="h-fit border-border/70 bg-[hsl(var(--surface-2))]/30">
                  <CardHeader>
                    <CardTitle className="text-base">Profile Snapshot</CardTitle>
                    <CardDescription>Quick access to account contact details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/80 p-3">
                      <div className="rounded-md bg-primary/12 p-2 text-primary">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-medium">{profileData.name || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/80 p-3">
                      <div className="rounded-md bg-primary/12 p-2 text-primary">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{profileData.email || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/80 p-3">
                      <div className="rounded-md bg-primary/12 p-2 text-primary">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{profileData.phone || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/80 p-3">
                      <div className="rounded-md bg-primary/12 p-2 text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm font-medium">{profileData.address || "Not set"}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-primary/30 bg-primary/8 p-3">
                      <p className="mb-1 flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Security Note
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Keep your profile up to date for faster checkout and delivery communication.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 bg-background shadow-sm">
                  <CardContent className="pt-6">
                    <Tabs defaultValue="personal" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="personal">Personal Information</TabsTrigger>
                        <TabsTrigger value="orders">Order History</TabsTrigger>
                      </TabsList>

                      <TabsContent value="personal" className="space-y-4">
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="name">Full Name</Label>
                              <Input id="name" name="name" value={profileData.name} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" name="email" type="email" value={profileData.email} disabled />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="address">Address</Label>
                              <Input id="address" name="address" value={profileData.address} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone</Label>
                              <Input id="phone" name="phone" value={profileData.phone} onChange={handleChange} />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Button type="submit" disabled={isUpdating} className="h-10 rounded-xl px-5">
                              {isUpdating ? "Updating..." : "Update Profile"}
                            </Button>
                            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setIsImageDialogOpen(true)}>
                              <Camera className="mr-2 h-4 w-4" />
                              Change Photo
                            </Button>
                          </div>
                        </form>
                      </TabsContent>

                      <TabsContent value="orders">
                        {isOrdersLoading ? (
                          <div className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/30 py-10 text-center">
                            <p className="text-muted-foreground">Loading your orders...</p>
                          </div>
                        ) : orders.length > 0 ? (
                          <div className="space-y-3">
                            {orders.map((order) => {
                              const totalItems = order.products?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
                              return (
                                <div
                                  key={order._id}
                                  className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/25 p-4"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold">Order #{order._id.slice(0, 8)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className={`${getStatusColor(order.status)} text-white`}>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </Badge>
                                  </div>

                                  <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Package className="h-4 w-4" />
                                      {totalItems} item{totalItems === 1 ? "" : "s"}
                                    </span>
                                    <span className="font-medium text-foreground">{formatPrice(order.totalAmount)}</span>
                                  </div>

                                  <div className="mt-3 flex justify-end">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/orders/${order._id}`}>
                                        View Details
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))]/30 py-10 text-center">
                            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                            <Button className="mt-4 rounded-xl" asChild>
                              <Link href="/products">Start Shopping</Link>
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
        </div>
      </div>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 bg-linear-to-b from-[hsl(var(--surface-1))] to-background sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Profile Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              {previewUrl ? (
                <div className="relative h-40 w-40 overflow-hidden rounded-full border border-primary/30 shadow-sm ring-4 ring-primary/8">
                  <AvatarImage src={previewUrl || "/placeholder.svg"} alt="Preview" className="object-cover w-full h-full" />
                </div>
              ) : (
                <Avatar className="h-40 w-40">
                  <AvatarImage src={profileData.image || "/placeholder.svg"} alt={user.fullName || "User"} />
                  <AvatarFallback>{(user.fullName || "U").charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-image">Select Image</Label>
              <Input id="profile-image" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImageUpload} disabled={!selectedFile}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
