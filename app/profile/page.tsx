"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { fetchBackendUserProfile, syncBackendUserProfile } from "@/lib/api/user-sync"
import { useStore } from "@/lib/store"
import Header from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import NoticeBar from "@/components/notice-bar"
import Sidebar from "@/components/sidebar"

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { updateUserImage } = useStore()
  const { toast } = useToast()
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    image: "",
    address: "",
    phone: "",
  })
  const [isUpdating, setIsUpdating] = useState(false)

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

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
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
    <main className="min-h-screen">
      <NoticeBar />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex relative">
          <Sidebar />
          <div className="flex-1 w-full">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription>Manage your account settings and preferences</CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                          <AvatarImage src={profileData.image || "/placeholder.svg"} alt={user.fullName || "User"} />
                          <AvatarFallback>{(user.fullName || "U").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 h-6 w-6 rounded-full"
                        onClick={() => setIsImageDialogOpen(true)}
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="personal">
                  <TabsList className="mb-4">
                    <TabsTrigger value="personal">Personal Information</TabsTrigger>
                    <TabsTrigger value="orders">Order History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal">
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" name="name" value={profileData.name} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={profileData.email}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" name="address" value={profileData.address} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" name="phone" value={profileData.phone} onChange={handleChange} />
                        </div>
                      </div>

                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Update Profile"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="orders">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                      <Button className="mt-4" asChild>
                        <a href="/products">Start Shopping</a>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Profile Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              {previewUrl ? (
                <div className="relative h-40 w-40 rounded-full overflow-hidden">
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="object-cover w-full h-full" />
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
