import Link from "next/link"
import Image from "next/image"
import { Package } from "lucide-react"
import { cloudinaryResize } from "@/lib/cloudinary"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
  storeSlug: string
  categoryName?: string
}

export function ProductCard({ product, storeSlug, categoryName }: ProductCardProps) {
  return (
    <Link
      href={`/s/${storeSlug}/${product.slug}`}
      className="group block overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: "var(--store-card-bg)",
        borderRadius: 20,
        border: "1px solid var(--store-border)",
        boxShadow: "var(--store-card-shadow, 0 2px 8px rgba(0,0,0,0.06))",
      }}
    >
      {/* Image area */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ borderRadius: "19px 19px 0 0" }}
      >
        {product.images?.[0] ? (
          <Image
            src={cloudinaryResize(product.images[0], 400)}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "var(--store-primary-light, #f5e8eb)" }}
          >
            <Package className="w-8 h-8 opacity-30" style={{ color: "var(--store-primary)" }} />
          </div>
        )}

        {/* Featured badge */}
        {product.is_featured && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: "var(--store-primary-light, #f5e8eb)",
              color: "var(--store-primary)",
            }}
          >
            ✦ Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        {categoryName && (
          <span
            className="inline-block text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{
              backgroundColor: "var(--store-primary-light, #f5e8eb)",
              color: "var(--store-primary)",
            }}
          >
            {categoryName}
          </span>
        )}
        <p
          className="text-sm font-medium line-clamp-2 leading-snug"
          style={{ color: "var(--store-text)" }}
        >
          {product.title}
        </p>
        <p className="font-bold" style={{ fontSize: 15, color: "var(--store-primary)" }}>
          &#8377;{product.price.toLocaleString("en-IN")}
        </p>
      </div>
    </Link>
  )
}
