"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

export default function SidebarToggle() {
  const { toggleSidebar } = useStore()

  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="rounded-xl">
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  )
}
