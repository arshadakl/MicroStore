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
        <div
          className="flex gap-6 flex-wrap border-b pb-4"
          style={{ borderColor: "var(--store-border)" }}
        >
          {[{ id: null as string | null, name: "All" }, ...categories].map((cat) => {
            const isActive = cat.id === activeCategoryId
            return (
              <button
                key={cat.id ?? "all"}
                onClick={() => setActiveCategoryId(cat.id)}
                className="text-sm tracking-wide transition-colors pb-1 border-b-2"
                style={{
                  color: isActive ? "var(--store-primary)" : "var(--store-text-muted)",
                  borderColor: isActive ? "var(--store-primary)" : "transparent",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20" style={{ color: "var(--store-text-muted)" }}>
          <p className="text-base">
            {activeCategoryId ? "No products in this category" : "No products yet"}
          </p>
        </div>
      )}
    </>
  )
}
