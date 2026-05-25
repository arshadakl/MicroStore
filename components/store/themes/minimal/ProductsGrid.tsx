"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
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
        <div className="flex gap-2 flex-wrap">
          {[{ id: null as string | null, name: "All" }, ...categories].map((cat) => {
            const isActive = cat.id === activeCategoryId
            return (
              <button
                key={cat.id ?? "all"}
                onClick={() => setActiveCategoryId(cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  isActive ? "text-white" : "hover:opacity-80"
                )}
                style={
                  isActive
                    ? { backgroundColor: "var(--store-primary)", borderColor: "var(--store-primary)", color: "#fff" }
                    : { borderColor: "var(--store-border)", color: "var(--store-text-muted)" }
                }
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
          <p className="text-base font-medium">
            {activeCategoryId ? "No products in this category" : "No products yet"}
          </p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </>
  )
}
