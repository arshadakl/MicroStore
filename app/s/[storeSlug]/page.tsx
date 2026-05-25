import { notFound } from "next/navigation"
import Link from "next/link"
import { getStoreBySlug, getCategoriesByStoreId, getActiveProductsByStoreId } from "@/lib/queries"
import { getThemeComponents } from "@/components/store/ThemeComponents"
import type { Product, Category } from "@/types"

export const revalidate = 60

interface StorePageProps {
  params: Promise<{ storeSlug: string }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { storeSlug } = await params

  // cache()-memoized: layout already called this, no extra DB query
  const store = await getStoreBySlug(storeSlug)
  if (!store) notFound()

  const [categories, allProducts] = await Promise.all([
    getCategoriesByStoreId(store.id),
    getActiveProductsByStoreId(store.id),
  ])

  const typedCategories = categories as Category[]
  const typedProducts = allProducts as Product[]

  const { BannerCarousel, ProductCard, ProductSection } = getThemeComponents(store.theme_id)

  const categoryMap: Record<string, string> = {}
  for (const c of typedCategories) categoryMap[c.id] = c.name

  const hasCategorisedProducts =
    typedCategories.length > 0 && typedProducts.some((p) => p.category_id)

  return (
    <main>
      <BannerCarousel store={store} storeSlug={store.slug} />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {typedProducts.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--store-text-muted)" }}>
            <p className="text-base font-medium">No products yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : hasCategorisedProducts ? (
          <>
            {/* Featured Picks — above category sections */}
            {(() => {
              const featured = typedProducts.filter((p) => p.is_featured).slice(0, 4)
              if (featured.length === 0) return null
              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden>✨</span>
                    <h2 className="text-lg font-bold" style={{ color: "var(--store-text)" }}>
                      Featured Picks
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {featured.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        storeSlug={store.slug}
                        categoryName={product.category_id ? categoryMap[product.category_id] : undefined}
                      />
                    ))}
                  </div>
                </section>
              )
            })()}

            {typedCategories.map((cat) => {
              const catProducts = typedProducts
                .filter((p) => p.category_id === cat.id)
                .slice(0, 8)
              if (catProducts.length === 0) return null
              return (
                <ProductSection
                  key={cat.id}
                  category={cat}
                  products={catProducts}
                  storeSlug={store.slug}
                  allProductsHref={`/s/${store.slug}/products?category=${cat.slug}`}
                />
              )
            })}

            {/* Uncategorised */}
            {(() => {
              const uncategorised = typedProducts.filter((p) => !p.category_id).slice(0, 8)
              if (uncategorised.length === 0) return null
              return (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold" style={{ color: "var(--store-text)" }}>
                      More Products
                    </h2>
                    <Link
                      href={`/s/${store.slug}/products`}
                      className="text-sm font-medium transition-opacity hover:opacity-70"
                      style={{ color: "var(--store-primary)" }}
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uncategorised.map((product) => (
                      <ProductCard key={product.id} product={product} storeSlug={store.slug} />
                    ))}
                  </div>
                </section>
              )
            })()}
          </>
        ) : (
          /* Featured / flat fallback */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: "var(--store-text)" }}>
                {typedProducts.some((p) => p.is_featured) ? "Featured" : "Products"}
              </h2>
              <Link
                href={`/s/${store.slug}/products`}
                className="text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--store-primary)" }}
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(typedProducts.some((p) => p.is_featured)
                ? typedProducts.filter((p) => p.is_featured)
                : typedProducts
              )
                .slice(0, 8)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeSlug={store.slug}
                    categoryName={
                      product.category_id ? categoryMap[product.category_id] : undefined
                    }
                  />
                ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
