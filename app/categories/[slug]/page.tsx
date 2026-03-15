import { Suspense } from "react"
import { notFound } from "next/navigation"
import Header from "@/components/header"
import ProductGrid from "@/components/product-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { getProducts } from "@/lib/api/products"
import Sidebar from "@/components/sidebar"
import NoticeBar from "@/components/notice-bar"

export const dynamic = "force-dynamic"

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  let products

  try {
    const allProducts = await getProducts()
    products = allProducts.filter((product) => product.category === params.slug)

    if (products.length === 0) {
      notFound()
    }
  } catch (error) {
    notFound()
  }

  // Format category name for display
  const categoryName = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <main className="min-h-screen">
      <NoticeBar />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex relative">
          <Sidebar />
          <div className="flex-1 w-full">
            <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid products={products} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}

function ProductGridSkeleton() {
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
