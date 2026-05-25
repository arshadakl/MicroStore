"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ProductCard } from "@/components/store/ProductCard"
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
      {/* Category filter tabs — client-side, no network request */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              activeCategoryId === null
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                activeCategoryId === cat.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-base font-medium">
            {activeCategoryId ? "No products in this category" : "No products yet"}
          </p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </>
  )
}
