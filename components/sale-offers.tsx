import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SaleOffers() {
  const offers = [
    {
      id: 1,
      title: "Summer Sale",
      description: "Up to 50% off on summer collection",
      bgColor: "bg-stone-100 dark:bg-stone-900",
      textColor: "text-stone-800 dark:text-stone-200",
      buttonVariant: "default" as const,
      link: "/sale/summer",
    },
    {
      id: 2,
      title: "New Arrivals",
      description: "Check out our latest collection",
      bgColor: "bg-stone-200 dark:bg-stone-800",
      textColor: "text-stone-800 dark:text-stone-200",
      buttonVariant: "outline" as const,
      link: "/new-arrivals",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {offers.map((offer) => (
        <Card key={offer.id} className={`${offer.bgColor} border-none`}>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-4">
              <h3 className={`text-2xl font-bold ${offer.textColor}`}>{offer.title}</h3>
              <p className={`${offer.textColor} opacity-90`}>{offer.description}</p>
              <Button variant={offer.buttonVariant} asChild>
                <Link href={offer.link}>Shop Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
