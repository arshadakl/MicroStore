import Link from "next/link"
import type { Category, Product } from "@/types"
import { ProductCard } from "./ProductCard"

interface ProductSectionProps {
  category: Category
  products: Product[]
  storeSlug: string
  allProductsHref: string
}

export function ProductSection({ category, products, storeSlug, allProductsHref }: ProductSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
          style={{
            backgroundColor: "var(--store-primary-light, #f5e8eb)",
            color: "var(--store-primary)",
          }}
        >
          {category.name}
        </span>
        <Link
          href={allProductsHref}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--store-primary)" }}
        >
          See all →
        </Link>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {products.map((product) => (
          <div
            key={product.id}
            style={{ width: "clamp(140px, 42vw, 180px)", flexShrink: 0 }}
          >
            <ProductCard product={product} storeSlug={storeSlug} />
          </div>
        ))}
      </div>
    </section>
  )
}
