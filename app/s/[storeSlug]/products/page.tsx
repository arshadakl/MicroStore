import { notFound } from "next/navigation"
import { getStoreBySlug, getCategoriesByStoreId, getActiveProductsByStoreId } from "@/lib/queries"
import { getThemeComponents } from "@/components/store/ThemeComponents"

export const revalidate = 60

interface ProductsPageProps {
  params: Promise<{ storeSlug: string }>
}

export default async function StoreProductsPage({ params }: ProductsPageProps) {
  const { storeSlug } = await params

  // cache()-memoized — shares with layout (no extra DB query)
  const store = await getStoreBySlug(storeSlug)
  if (!store) notFound()

  const [categories, products] = await Promise.all([
    getCategoriesByStoreId(store.id),
    getActiveProductsByStoreId(store.id),
  ])

  const { ProductsGrid } = getThemeComponents(store.theme_id)

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-xl font-semibold" style={{ color: "var(--store-text)" }}>
        All Products
      </h1>
      {/* Category filtering is client-side — no searchParams → page stays ISR-cacheable */}
      <ProductsGrid products={products} categories={categories} storeSlug={store.slug} />
    </main>
  )
}
