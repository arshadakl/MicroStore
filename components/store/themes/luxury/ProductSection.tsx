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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-wide" style={{ color: "var(--store-text)" }}>
          {category.name}
        </h2>
        <Link
          href={allProductsHref}
          className="text-sm font-medium tracking-wide transition-opacity hover:opacity-70"
          style={{ color: "var(--store-primary)" }}
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
        ))}
      </div>
    </section>
  )
}
