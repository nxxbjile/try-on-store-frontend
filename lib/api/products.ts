// This file would contain the API calls to the backend
// For now, we'll use mock data
import axios from "axios";

export type Product = {
  _id?: string
  name: string
  description: string
  category: "shirt" | "t-shirt" | "pants"
  price: number
  discount?: number
  images: string[]
  sizes: string[]
  stock: Array<{
    size: string
    color: string
    quantity: number
  }>
  createdAt?: string
  updatedAt?: string
}

export type ProductWithDetails = Product & {
  details: string // Additional field for UI display
}

export async function getProducts(options = {}): Promise<Product[]> {
  // In a real app, we would fetch from the API
  // For example: return fetch('/api/v1/products').then(res => res.json())
  const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MjZlNjJhZDk0MWNlNmI3NmZiNDYzMyIsImlhdCI6MTc0NzM4MDE0OSwiZXhwIjoxNzQ3OTg0OTQ5fQ.dBfLcp05WIIOXz4qtJDJ03EiYLZsfnfJ0OSO0F3Xauk"

  // Use NEXT_PUBLIC_ prefix for frontend env variables
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/^"|"$/g, "");
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_BASE_URL is not defined in your environment variables.");
  }
  const res = await axios.get(`${baseUrl}/products`, {
    headers: {
      "Authorization": `Bearer ${TOKEN}`
    }
  });

  const products = res.data.products;
  // console.log("Products fetched from API:", products);
  // console.log("Base URL:", baseUrl);
  // console.log("Res ", res);
// // Mock data based on the API docs
  // const mockProducts: Product[] = [
  //   {
  //     _id: "1",
  //     name: "Classic White Shirt",
  //     description:
  //       "A timeless white shirt that goes with everything. Made from premium cotton for comfort and durability.",
  //     category: "shirt",
  //     price: 59.99,
  //     images: [
  //       "/placeholder.svg?height=600&width=600",
  //       "/placeholder.svg?height=600&width=600",
  //       "/placeholder.svg?height=600&width=600",
  //     ],
  //     sizes: ["S", "M", "L", "XL"],
  //     colors: ["white", "blue"],
  //     stock: [
  //       { size: "S", color: "white", quantity: 10 },
  //       { size: "M", color: "white", quantity: 15 },
  //       { size: "L", color: "white", quantity: 12 },
  //       { size: "XL", color: "white", quantity: 8 },
  //       { size: "S", color: "blue", quantity: 5 },
  //       { size: "M", color: "blue", quantity: 10 },
  //       { size: "L", color: "blue", quantity: 8 },
  //       { size: "XL", color: "blue", quantity: 6 },
  //     ],
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString(),
  //   },
  //   {
  //     _id: "2",
  //     name: "Slim Fit Jeans",
  //     description: "Modern slim fit jeans with a comfortable stretch. Perfect for casual everyday wear.",
  //     category: "pants",
  //     price: 79.99,
  //     discount: 10,
  //     images: [
  //       "/placeholder.svg?height=600&width=600",
  //       "/placeholder.svg?height=600&width=600",
  //       "/placeholder.svg?height=600&width=600",
  //     ],
  //     sizes: ["30", "32", "34", "36"],
  //     colors: ["blue", "black"],
  //     stock: [
  //       { size: "30", color: "blue", quantity: 8 },
  //       { size: "32", color: "blue", quantity: 12 },
  //       { size: "34", color: "blue", quantity: 10 },
  //       { size: "36", color: "blue", quantity: 6 },
  //       { size: "30", color: "black", quantity: 7 },
  //       { size: "32", color: "black", quantity: 14 },
  //       { size: "34", color: "black", quantity: 9 },
  //       { size: "36", color: "black", quantity: 5 },
  //     ],
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString(),
  //   },
  //   // Add more mock products as needed
  // ]

  // return mockProducts
  return products;
}

export async function getProduct(id: string): Promise<ProductWithDetails | null> {
  // In a real app, we would fetch from the API
  // For example: return fetch(`/api/v1/products/${id}`).then(res => res.json())

  const products = await getProducts()
  const product = products.find((p) => p._id === id)

  if (!product) return null

  // Add additional details for the product page
  return {
    ...product,
    details: `<p>Our ${product.name} is designed for comfort and style. Features include:</p>
      <ul>
        <li>${product.category === "shirt" ? "100% premium cotton" : "High-quality fabric"}</li>
        <li>${product.category === "shirt" ? "Button-down collar" : product.category === "pants" ? "Comfortable waistband" : "Crew neck"}</li>
        <li>Regular fit</li>
        <li>Machine washable</li>
      </ul>`,
  }
}

export async function getCategories() {
  // In a real app, we would fetch from the API
  // For now, we'll return mock data
  return [
    { _id: "1", name: "Shirts", slug: "shirt", imageUrl: "/placeholder.svg?height=80&width=80" },
    { _id: "2", name: "T-Shirts", slug: "t-shirt", imageUrl: "/placeholder.svg?height=80&width=80" },
    { _id: "3", name: "Pants", slug: "pants", imageUrl: "/placeholder.svg?height=80&width=80" },
    { _id: "4", name: "Jackets", slug: "jackets", imageUrl: "/placeholder.svg?height=80&width=80" },
    { _id: "5", name: "Accessories", slug: "accessories", imageUrl: "/placeholder.svg?height=80&width=80" },
    { _id: "6", name: "Shoes", slug: "shoes", imageUrl: "/placeholder.svg?height=80&width=80" },
  ]
}
