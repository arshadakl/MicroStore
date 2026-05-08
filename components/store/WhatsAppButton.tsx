"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackWhatsAppClick } from "@/lib/actions/analytics"

interface WhatsAppButtonProps {
  phone: string
  productTitle: string
  price: number
  productUrl: string
  storeId: string
  productId: string
}

export function WhatsAppButton({
  phone,
  productTitle,
  price,
  productUrl,
  storeId,
  productId,
}: WhatsAppButtonProps) {
  function handleClick() {
    void trackWhatsAppClick(storeId, productId)
    const message = `I want to buy:\n\nProduct: ${productTitle}\nPrice: ₹${price.toLocaleString("en-IN")}\nLink: ${productUrl}`
    const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white text-base font-semibold gap-2.5 h-12"
        onClick={handleClick}
      >
        <MessageCircle className="w-5 h-5" />
        Buy on WhatsApp
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Tap to open WhatsApp and send your order message automatically.
      </p>
    </div>
  )
}
