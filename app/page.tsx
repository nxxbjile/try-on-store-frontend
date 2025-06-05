import { Suspense } from "react"
import Header from "@/components/header"
import FeaturedProducts from "@/components/featured-products"
import SaleOffers from "@/components/sale-offers"
import { Skeleton } from "@/components/ui/skeleton"
import NoticeBar from "@/components/notice-bar"
import Sidebar from "@/components/sidebar"

export default function Home() {
  return (
    <main className="min-h-screen">
      <NoticeBar />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex relative">
          <Sidebar />
          <div className="flex-1 w-full">
            <div className="mt-6 md:mt-0">
              <h2 className="text-2xl font-bold mb-6">Top Selling Items</h2>
              <Suspense fallback={<ProductsSkeleton />}>
                <FeaturedProducts />
              </Suspense>
            </div>

            <div className="mt-12 mb-12">
              <h2 className="text-2xl font-bold mb-6">Special Offers</h2>
              <SaleOffers />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex flex-col">
            <Skeleton className="h-48 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 mt-2" />
            <Skeleton className="h-4 w-1/2 mt-2" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </div>
        ))}
    </div>
  )
}
