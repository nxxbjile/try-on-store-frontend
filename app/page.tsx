import { Suspense } from "react"
import Header from "@/components/header"
import FeaturedProducts from "@/components/featured-products"
import CategoryCarousels from "@/components/category-carousels"
import { Skeleton } from "@/components/ui/skeleton"
import NoticeBar from "@/components/notice-bar"
import Sidebar from "@/components/sidebar"

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[hsl(var(--surface-1))]">
      <NoticeBar />
      <Header />
      <div className="container relative mx-auto px-4 py-8 md:px-6 md:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-linear-to-b from-[hsl(var(--accent-soft))]/60 to-transparent" />
        <div className="relative flex items-start">
          <Sidebar />
          <div className="flex-1 w-full space-y-8 md:space-y-10">
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md">
              <div className="h-1.5 w-full bg-linear-to-r from-[hsl(var(--accent-strong))] to-[hsl(var(--primary))]" />
              <div className="px-6 py-6 md:px-8 md:py-8">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Top Selling Items</h2>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">Curated customer favorites picked for this week.</p>
              </div>
              <div className="px-6 pb-6 md:px-8 md:pb-8">
              <Suspense fallback={<ProductsSkeleton />}>
                <FeaturedProducts />
              </Suspense>
              </div>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card px-4 py-5 shadow-md md:px-6 md:py-6">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Shop By Category</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Browse curated category rails and jump to full search results for each section.
              </p>
              <div className="mt-6">
                <CategoryCarousels />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 md:gap-6">
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
