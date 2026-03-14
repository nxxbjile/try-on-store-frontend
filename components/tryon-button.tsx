"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import TryonDialog from "@/components/tryon-dialog"

type TryonButtonProps = {
  productId: string
  productName: string
}

export default function TryonButton({ productId, productName }: TryonButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setIsOpen(true)}>
        Virtual Try-On
      </Button>

      <TryonDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        productId={productId}
        productName={productName}
      />
    </>
  )
}
