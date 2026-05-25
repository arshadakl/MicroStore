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
      className="group block overflow-hidden rounded-sm border transition-colors"
      style={{ backgroundColor: "var(--store-card-bg)", borderColor: "var(--store-border)" }}
    >
      <div className="relative aspect-[4/3]" style={{ backgroundColor: "var(--store-card-bg)" }}>
        {product.images?.[0] ? (
          <Image
            src={cloudinaryResize(product.images[0], 400)}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-8 h-8 opacity-30" style={{ color: "var(--store-text-muted)" }} />
          </div>
        )}
      </div>
      <div className="p-3">
        {categoryName && (
          <p
            className="text-xs uppercase tracking-widest mb-1 opacity-60"
            style={{ color: "var(--store-text-muted)" }}
          >
            {categoryName}
          </p>
        )}
        <p className="text-sm font-normal line-clamp-2 leading-snug" style={{ color: "var(--store-text)" }}>
          {product.title}
        </p>
        <p className="text-sm font-medium mt-1" style={{ color: "var(--store-text)" }}>
          &#8377;{product.price.toLocaleString("en-IN")}
        </p>
      </div>
    </Link>
  )
}
