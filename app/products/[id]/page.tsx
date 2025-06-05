import { Suspense } from "react"
import { notFound } from "next/navigation"
import Header from "@/components/header"
import ProductDetails from "@/components/product-details"
import { Skeleton } from "@/components/ui/skeleton"
import { getProduct } from "@/lib/api/products"
import Sidebar from "@/components/sidebar"
import NoticeBar from "@/components/notice-bar"

export default async function ProductPage( {params}: any) {
  let product
  const { id } = await params;
  try {
    product = await getProduct(id)
  } catch (error) {
    notFound()
  }

  if (!product) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <NoticeBar />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex relative">
          <Sidebar />
          <div className="flex-1 w-full">
            <Suspense fallback={<ProductDetailsSkeleton />}>
              <ProductDetails product={product} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}

function ProductDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Skeleton className="h-96 w-full rounded-md" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
