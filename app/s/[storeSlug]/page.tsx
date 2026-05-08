import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { trackEvent, getCategoriesByStoreId } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/store/ProductCard"
import { ArrowRight } from "lucide-react"
import type { Product, Category } from "@/types"

interface StorePageProps {
  params: Promise<{ storeSlug: string }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { storeSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", storeSlug)
    .single()

  if (!store) notFound()

  void trackEvent(store.id, "view")

  const [categoriesRaw, productsRaw] = await Promise.all([
    getCategoriesByStoreId(store.id),
    supabase
      .from("products")
      .select("*")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ])

  const categories = categoriesRaw as Category[]
  const allProducts = (productsRaw.data ?? []) as Product[]

  // Build category map for label lookups
  const categoryMap: Record<string, string> = {}
  for (const c of categories) categoryMap[c.id] = c.name

  // Decide render mode
  const hasCategorisedProducts =
    categories.length > 0 && allProducts.some((p) => p.category_id)

  return (
    <main>
      {/* Banner */}
      {store.banner_url && (
        <div className="relative w-full h-48 sm:h-64 overflow-hidden">
          <Image
            src={store.banner_url}
            alt={`${store.name} banner`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* Store header */}
        <div className="text-center space-y-2">
          {store.logo_url && (
            <div
              className={`relative w-20 h-20 rounded-full overflow-hidden mx-auto border-4 shadow-md${store.banner_url ? " -mt-14" : ""}`}
              style={{ borderColor: "var(--store-bg)" }}
            >
              <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-balance" style={{ color: "var(--store-text)" }}>
            {store.name}
          </h1>
          {store.tagline && (
            <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--store-text-muted)" }}>
              {store.tagline}
            </p>
          )}
        </div>

        {allProducts.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--store-text-muted)" }}>
            <p className="text-base font-medium">No products yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : hasCategorisedProducts ? (
          /* Category sections */
          <div className="space-y-12">
            {categories.map((cat) => {
              const catProducts = allProducts
                .filter((p) => p.category_id === cat.id)
                .slice(0, 8)
              if (catProducts.length === 0) return null
              return (
                <section key={cat.id} className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold" style={{ color: "var(--store-text)" }}>
                      {cat.name}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="gap-1"
                      style={{ color: "var(--store-primary)" }}
                    >
                      <Link href={`/s/${store.slug}/products?category=${cat.slug}`}>
                        View all <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {catProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        storeSlug={store.slug}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {/* Uncategorised products */}
            {(() => {
              const uncategorised = allProducts
                .filter((p) => !p.category_id)
                .slice(0, 8)
              if (uncategorised.length === 0) return null
              return (
                <section className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2
                      className="text-lg font-semibold"
                      style={{ color: "var(--store-text)" }}
                    >
                      More Products
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="gap-1"
                      style={{ color: "var(--store-primary)" }}
                    >
                      <Link href={`/s/${store.slug}/products`}>
                        View all <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uncategorised.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        storeSlug={store.slug}
                      />
                    ))}
                  </div>
                </section>
              )
            })()}
          </div>
        ) : (
          /* Featured / flat fallback */
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: "var(--store-text)" }}>
                {allProducts.some((p) => p.is_featured) ? "Featured Products" : "Products"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-1"
                style={{ color: "var(--store-primary)" }}
              >
                <Link href={`/s/${store.slug}/products`}>
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(allProducts.some((p) => p.is_featured)
                ? allProducts.filter((p) => p.is_featured)
                : allProducts
              )
                .slice(0, 8)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeSlug={store.slug}
                    categoryName={product.category_id ? categoryMap[product.category_id] : undefined}
                  />
                ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
