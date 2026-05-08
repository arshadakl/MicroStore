"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { toggleProductAdminHidden } from "@/lib/actions/admin"
import { Eye, EyeOff } from "lucide-react"

interface AdminProductToggleProps {
  product: Product
}

export function AdminProductToggle({ product }: AdminProductToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isHidden, setIsHidden] = useState(product.admin_hidden)

  async function handleToggle() {
    setLoading(true)
    const result = await toggleProductAdminHidden(product.id)
    setLoading(false)

    if (result.success) {
      setIsHidden((prev) => !prev)
      toast({
        title: isHidden ? "Product visible" : "Product hidden",
        description: isHidden
          ? "Product is now visible on the storefront."
          : "Product is now hidden from the storefront.",
      })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error || "Action failed", variant: "destructive" })
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={isHidden ? "text-amber-600 hover:text-amber-700" : "text-muted-foreground hover:text-foreground"}
      title={isHidden ? "Hidden by admin — click to show" : "Visible — click to hide"}
    >
      {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      <span className="ml-1 text-xs">{isHidden ? "Hidden" : "Visible"}</span>
    </Button>
  )
}
