"use client"

import { useState } from "react"
import { ProductCard } from "./ProductCard"
import type { Product, Category } from "@/types"

interface ProductsGridProps {
  products: Product[]
  categories: Category[]
  storeSlug: string
}

export function ProductsGrid({ products, categories, storeSlug }: ProductsGridProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const filtered =
    activeCategoryId === null
      ? products
      : products.filter((p) => p.category_id === activeCategoryId)

  return (
    <>
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {[{ id: null as string | null, name: "All" }, ...categories].map((cat) => {
            const isActive = cat.id === activeCategoryId
            return (
              <button
                key={cat.id ?? "all"}
                onClick={() => setActiveCategoryId(cat.id)}
                className="px-5 py-2 text-xs font-medium tracking-widest uppercase border transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--store-primary)" : "transparent",
                  color: isActive ? "#0F0E0D" : "var(--store-primary)",
                  borderColor: "var(--store-primary)",
                }}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20" style={{ color: "var(--store-text-muted)" }}>
          <p className="text-sm tracking-wide uppercase">
            {activeCategoryId ? "No products in this category" : "No products yet"}
          </p>
        </div>
      )}
    </>
  )
}
