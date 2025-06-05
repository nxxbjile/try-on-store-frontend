export default function BrandShowcase() {
  const brands = [
    { id: 1, name: "Nike", logo: "/placeholder.svg?height=60&width=120" },
    { id: 2, name: "Adidas", logo: "/placeholder.svg?height=60&width=120" },
    { id: 3, name: "Puma", logo: "/placeholder.svg?height=60&width=120" },
    { id: 4, name: "Levi's", logo: "/placeholder.svg?height=60&width=120" },
    { id: 5, name: "H&M", logo: "/placeholder.svg?height=60&width=120" },
    { id: 6, name: "Zara", logo: "/placeholder.svg?height=60&width=120" },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-8 md:gap-12">
      {brands.map((brand) => (
        <div key={brand.id} className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all">
          <img src={brand.logo || "/placeholder.svg"} alt={brand.name} className="h-12 md:h-16" />
        </div>
      ))}
    </div>
  )
}
