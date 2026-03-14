"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { ArrowUpRight, BarChart3, DollarSign, PackageCheck, Sparkles, Users } from "lucide-react"
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn } = useAuth()
  const role = useStore((state) => state.user?.role)

  // Get tab from URL or default to "dashboard"
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(()=> {
    const tabParam = searchParams.get("tab")
    setActiveTab(tabParam || "dashboard")
  },[searchParams])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin?tab=${value}`, { scroll: false })
  }

  if (!isLoaded || !isSignedIn || role !== "admin") {
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
    <main className="min-h-screen bg-[hsl(var(--surface-1))]">
      <NoticeBar />
      <Header />
      <div className="container relative mx-auto px-4 py-8 md:px-6 md:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-linear-to-b from-[hsl(var(--accent-soft))]/60 to-transparent" />
        <div className="relative flex items-start gap-6 lg:gap-8">
          <AdminSidebar />
          <div className="flex-1 w-full space-y-8 md:space-y-10">
            <Card className="overflow-hidden rounded-2xl border-border/70 bg-card shadow-md">
              <div className="h-1.5 w-full bg-linear-to-r from-[hsl(var(--accent-strong))] to-[hsl(var(--primary))]" />
              <CardHeader className="relative px-6 pb-7 pt-7 md:px-8 md:pb-8 md:pt-8">
                <div className="absolute inset-0 bg-linear-to-r from-[hsl(var(--accent-soft))]/70 via-transparent to-transparent" />
                <div className="relative flex flex-col gap-4">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-[hsl(var(--surface-2))] px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent-strong))]" />
                    Control Center
                  </div>
                  <CardTitle className="text-2xl tracking-tight md:text-3xl lg:text-4xl">Admin Dashboard</CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-6 md:text-base md:leading-7">
                    Monitor operations, review performance, and manage your catalog from one focused workspace.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="-mx-4 px-4 overflow-x-auto">
                <TabsList className="mb-6 min-w-max">
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
                <div className="grid grid-cols-1 gap-5 md:mb-8 md:grid-cols-3 md:gap-6 mb-7">
                  <Card className="rounded-2xl border-border/70 bg-card shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <CardHeader className="px-5 pb-2 pt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="rounded-xl border border-border/70 bg-[hsl(var(--accent-soft))] p-2 text-[hsl(var(--accent-strong))]">
                          <PackageCheck className="h-4 w-4" />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-[hsl(var(--surface-2))] px-2 py-0.5 text-xs text-muted-foreground">
                          <ArrowUpRight className="h-3 w-3" />
                          Monthly
                        </span>
                      </div>
                      <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-1">
                      <p className="text-3xl font-semibold tracking-tight">128</p>
                      <p className="mt-1.5 text-sm text-muted-foreground">+12% from last month</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/70 bg-card shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <CardHeader className="px-5 pb-2 pt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="rounded-xl border border-border/70 bg-[hsl(var(--accent-soft))] p-2 text-[hsl(var(--accent-strong))]">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-[hsl(var(--surface-2))] px-2 py-0.5 text-xs text-muted-foreground">
                          <ArrowUpRight className="h-3 w-3" />
                          Monthly
                        </span>
                      </div>
                      <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-1">
                      <p className="text-3xl font-semibold tracking-tight">$12,543</p>
                      <p className="mt-1.5 text-sm text-muted-foreground">+8% from last month</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/70 bg-card shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <CardHeader className="px-5 pb-2 pt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="rounded-xl border border-border/70 bg-[hsl(var(--accent-soft))] p-2 text-[hsl(var(--accent-strong))]">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-[hsl(var(--surface-2))] px-2 py-0.5 text-xs text-muted-foreground">
                          <ArrowUpRight className="h-3 w-3" />
                          Monthly
                        </span>
                      </div>
                      <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-1">
                      <p className="text-3xl font-semibold tracking-tight">543</p>
                      <p className="mt-1.5 text-sm text-muted-foreground">+15% from last month</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-7">
                  <Card className="rounded-2xl border-border/70 bg-card shadow-md">
                    <CardHeader className="border-b border-border/60 bg-[hsl(var(--surface-2))] px-6 py-5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Recent Orders</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardDescription>Latest customer purchases and status updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                      <OrdersList />
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/70 bg-card shadow-md">
                    <CardHeader className="border-b border-border/60 bg-[hsl(var(--surface-2))] px-6 py-5">
                      <CardTitle className="text-lg">Top Products</CardTitle>
                      <CardDescription>Most purchased items in the current period.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
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
