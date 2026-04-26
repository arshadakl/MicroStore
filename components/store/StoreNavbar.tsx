import Link from "next/link"
import Image from "next/image"
import { Store, Theme } from "@/types"
import { MessageCircle } from "lucide-react"

interface StoreNavbarProps {
  store: Store
  theme?: Theme
}

export function StoreNavbar({ store, theme = "minimal" }: StoreNavbarProps) {
  const waUrl = `https://wa.me/${store.whatsapp_number.replace(/\D/g, "")}`

  return (
    <header 
      className="store-border border-b sticky top-0 z-40"
      style={{ 
        backgroundColor: "var(--store-bg)",
        borderColor: "var(--store-border)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/s/${store.slug}`} className="flex items-center gap-2.5">
          {store.logo_url ? (
            <div className="relative w-8 h-8 rounded-md overflow-hidden">
              <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
            </div>
          ) : (
            <div 
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--store-primary)", opacity: 0.15 }}
            >
              <span 
                className="font-bold text-sm"
                style={{ color: "var(--store-primary)" }}
              >
                {store.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-semibold text-sm" style={{ color: "var(--store-text)" }}>
            {store.name}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/s/${store.slug}/products`}
            className="text-sm transition-colors hidden sm:block store-text-muted hover:opacity-80"
            style={{ color: "var(--store-text-muted)" }}
          >
            All Products
          </Link>
          <a 
            href={waUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="store-primary-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white transition-all"
            style={{ 
              backgroundColor: "var(--store-primary)",
              borderRadius: "var(--store-btn-radius)",
            }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  )
}
