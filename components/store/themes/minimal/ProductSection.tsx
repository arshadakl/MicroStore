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

      <div className="grid grid-cols-3 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
        ))}
      </div>
    </section>
  )
}
