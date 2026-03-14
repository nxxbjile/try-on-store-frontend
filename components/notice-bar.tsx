"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

const NOTICE_DISMISSED_KEY = "notice-bar-dismissed"

export default function NoticeBar() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissed = window.localStorage.getItem(NOTICE_DISMISSED_KEY)
    setIsVisible(dismissed !== "true")
  }, [])

  const handleClose = () => {
    window.localStorage.setItem(NOTICE_DISMISSED_KEY, "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <Alert className="rounded-none border-t-0 border-x-0">
      <AlertDescription className="flex items-center justify-between">
        <span className="text-center flex-1">
          ⚠️ Our services are currently only available in Delhi. We're working on expanding to more cities soon!
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
