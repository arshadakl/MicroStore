import Link from "next/link"
import Image from "next/image"
import { Product } from "@/types"
import { Package } from "lucide-react"

interface ProductCardProps {
  product: Product
  storeSlug: string
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  return (
    <Link
      href={`/s/${storeSlug}/${product.slug}`}
      className="group block overflow-hidden store-card border transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "var(--store-card-bg)",
        borderColor: "var(--store-border)",
        borderRadius: "0.75rem",
      }}
    >
      {/* Image */}
      <div 
        className="relative aspect-square"
        style={{ backgroundColor: "var(--store-card-bg)" }}
      >
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-8 h-8 store-text-muted" style={{ color: "var(--store-text-muted)", opacity: 0.4 }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-0.5">
        <p 
          className="text-sm font-medium line-clamp-2 leading-snug"
          style={{ color: "var(--store-text)" }}
        >
          {product.title}
        </p>
        <p 
          className="text-sm font-semibold store-primary-text"
          style={{ color: "var(--store-primary)" }}
        >
          &#8377;{product.price.toLocaleString("en-IN")}
        </p>
      </div>
    </Link>
  )
}
