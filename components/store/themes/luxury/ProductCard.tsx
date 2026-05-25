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
      className="group block overflow-hidden border transition-all duration-300"
      style={{
        backgroundColor: "var(--store-card-bg)",
        borderColor: "rgba(212,175,55,0.25)",
      }}
    >
      <div className="relative aspect-[3/4]" style={{ backgroundColor: "var(--store-card-bg)" }}>
        {product.images?.[0] ? (
          <Image
            src={cloudinaryResize(product.images[0], 400)}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:opacity-90 transition-opacity duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-8 h-8 opacity-20" style={{ color: "var(--store-text-muted)" }} />
          </div>
        )}
      </div>
      <div
        className="px-3 py-3 border-t"
        style={{ borderColor: "rgba(212,175,55,0.15)" }}
      >
        {categoryName && (
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "var(--store-primary)", opacity: 0.8 }}
          >
            {categoryName}
          </p>
        )}
        <p className="text-sm font-light line-clamp-2" style={{ color: "var(--store-text)" }}>
          {product.title}
        </p>
        <p className="text-sm font-medium mt-1" style={{ color: "#EDD98A" }}>
          &#8377;{product.price.toLocaleString("en-IN")}
        </p>
      </div>
    </Link>
  )
}
