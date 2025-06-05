"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import OrdersList from "@/components/admin/orders-list"
import ProductsList from "@/components/admin/products-list"
import AdminSidebar from "@/components/admin/admin-sidebar"
import NoticeBar from "@/components/notice-bar"
import CustomersList from "@/components/admin/customers-list"
import CategoriesList from "@/components/admin/categories-list"
import AnalyticsDashboard from "@/components/admin/analytics-dashboard"
import SettingsPanel from "@/components/admin/settings-panel"
import { useStore } from "@/lib/store"

export default function AdminDashboard() {
  const { user, isAuthLoading: isLoading, hasHydrated } = useStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Get tab from URL or default to "dashboard"
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(()=> {
    const tabParam = searchParams.get("tab")
    setActiveTab(tabParam || "dashboard")
  },[searchParams])

  useEffect(() => {
    if(!hasHydrated) return
    if (!isLoading) {
      if (!user) {
        router.push("/login?redirect=/admin")
      } else if (user.role !== "admin") {
        router.push("/")
      } else {
        setIsAuthorized(true)
      }
    }
  }, [user, isLoading, router])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin?tab=${value}`, { scroll: false })
  }

  if (isLoading || !isAuthorized) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-full w-full sm:max-w-lg mx-auto">
            <CardContent className="pt-6 overflow-auto">
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
          <AdminSidebar />
          <div className="flex-1 w-full">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Manage your store's products, orders, and customers</CardDescription>
              </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="-mx-4 px-4 overflow-x-auto">
                <TabsList className="mb-4 min-w-max">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dashboard">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">128</p>
                      <p className="text-sm text-muted-foreground">+12% from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">$12,543</p>
                      <p className="text-sm text-muted-foreground">+8% from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">543</p>
                      <p className="text-sm text-muted-foreground">+15% from last month</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <OrdersList />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProductsList />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="orders">
                <OrdersList />
              </TabsContent>

              <TabsContent value="products">
                <ProductsList />
              </TabsContent>

              <TabsContent value="customers">
                <CustomersList />
              </TabsContent>

              <TabsContent value="categories">
                <CategoriesList />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="settings">
                <SettingsPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  )
}
