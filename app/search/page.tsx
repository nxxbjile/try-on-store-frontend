"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/header"
import NoticeBar from "@/components/notice-bar"
import Sidebar from "@/components/sidebar"
import ProductGrid from "@/components/product-grid"
import { useStore } from "@/lib/store"
import type { Product } from "@/lib/api/products"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "all" },
  { label: "Shirt", value: "shirt" },
  { label: "T-Shirt", value: "t-shirt" },
  { label: "Pants", value: "pants" },
]

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt" },
  { label: "Price", value: "price" },
  { label: "Name", value: "name" },
]

const ORDER_OPTIONS = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
]

const LIMIT_OPTIONS = [12, 20, 40]

export default function SearchPage() {
  const { getProducts } = useStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [nameInput, setNameInput] = useState("")
  const [categoryInput, setCategoryInput] = useState("all")
  const [sizeInput, setSizeInput] = useState("all")
  const [sortInput, setSortInput] = useState("createdAt")
  const [orderInput, setOrderInput] = useState("desc")
  const [limitInput, setLimitInput] = useState("20")
  const [showFilters, setShowFilters] = useState(false)

  const currentPage = useMemo(() => {
    const raw = Number(searchParams.get("page") || "1")
    return Number.isFinite(raw) && raw > 0 ? raw : 1
  }, [searchParams])

  useEffect(() => {
    setNameInput(searchParams.get("name") || searchParams.get("q") || "")
    setCategoryInput(searchParams.get("category") || "all")
    setSizeInput(searchParams.get("size") || "all")
    setSortInput(searchParams.get("sort") || "createdAt")
    setOrderInput(searchParams.get("order") || "desc")
    setLimitInput(searchParams.get("limit") || "20")
  }, [searchParams])

  const fetchResults = useCallback(async () => {
    const page = Number(searchParams.get("page") || "1") || 1
    const limit = Number(searchParams.get("limit") || "20") || 20

    const params: Record<string, string> = {
      sort: searchParams.get("sort") || "createdAt",
      order: searchParams.get("order") || "desc",
      page: String(page),
      limit: String(limit),
    }

    const name = searchParams.get("name") || searchParams.get("q")
    const category = searchParams.get("category")
    const size = searchParams.get("size")

    if (name) params.name = name
    if (category) params.category = category
    if (size) params.size = size

    setIsLoading(true)
    try {
      const res = await getProducts(params)
      const nextProducts: Product[] = Array.isArray(res?.products) ? res.products : []
      setProducts(nextProducts)
      setTotalCount(Number(res?.count) || nextProducts.length)
      setTotalPages(Math.max(1, Number(res?.total_pages) || 1))
    } catch {
      setProducts([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [getProducts, searchParams])

  useEffect(() => {
    void fetchResults()
  }, [fetchResults])

  const updateQuery = (nextPage: number) => {
    const params = new URLSearchParams()
    if (nameInput.trim()) params.set("name", nameInput.trim())
    if (categoryInput !== "all") params.set("category", categoryInput)
    if (sizeInput !== "all") params.set("size", sizeInput)
    params.set("sort", sortInput)
    params.set("order", orderInput)
    params.set("page", String(nextPage))
    params.set("limit", limitInput)
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setNameInput("")
    setCategoryInput("all")
    setSizeInput("all")
    setSortInput("createdAt")
    setOrderInput("desc")
    setLimitInput("20")
    router.push(`${pathname}?sort=createdAt&order=desc&page=1&limit=20`)
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--surface-1))]">
      <NoticeBar />
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex relative">
          <Sidebar />

          <div className="w-full flex-1 space-y-6">
            <Card className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Search Products</CardTitle>
                    <CardDescription>Find products with filters and sorting.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent
                className={`grid transition-all duration-300 ease-out ${
                  showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="space-y-4 overflow-hidden pt-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="search-name">Product Name</Label>
                    <Input
                      id="search-name"
                      placeholder="Search by product name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryInput} onValueChange={setCategoryInput}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search-size">Size</Label>
                    <Input
                      id="search-size"
                      placeholder="e.g. S, M, L, XL"
                      value={sizeInput === "all" ? "" : sizeInput}
                      onChange={(e) => setSizeInput(e.target.value ? e.target.value : "all")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sort</Label>
                    <Select value={sortInput} onValueChange={setSortInput}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Select value={orderInput} onValueChange={setOrderInput}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Per Page</Label>
                    <Select value={limitInput} onValueChange={setLimitInput}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIMIT_OPTIONS.map((limit) => (
                          <SelectItem key={limit} value={String(limit)}>
                            {limit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => updateQuery(1)}>Apply Filters</Button>
                  <Button variant="outline" onClick={clearFilters}>Reset</Button>
                </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading results..." : `${totalCount} result${totalCount === 1 ? "" : "s"} found`}
              </p>
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
            </div>

            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              !isLoading && (
                <Card className="border-border/70">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No products matched your search.
                  </CardContent>
                </Card>
              )
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => updateQuery(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => updateQuery(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
