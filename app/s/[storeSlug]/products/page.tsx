import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getCategoriesByStoreId } from "@/lib/queries"
import { ProductCard } from "@/components/store/ProductCard"
import { cn } from "@/lib/utils"

interface ProductsPageProps {
  params: Promise<{ storeSlug: string }>
  searchParams: Promise<{ category?: string }>
}

export default async function StoreProductsPage({ params, searchParams }: ProductsPageProps) {
  const { storeSlug } = await params
  const { category: categorySlug } = await searchParams
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", storeSlug)
    .single()

  if (!store) notFound()

  const categories = await getCategoriesByStoreId(store.id)

  let query = supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (categorySlug) {
    const matchedCategory = categories.find((c) => c.slug === categorySlug)
    if (matchedCategory) {
      query = query.eq("category_id", matchedCategory.id) as typeof query
    }
  }

  const { data: products } = await query

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-xl font-semibold text-foreground">All Products</h1>

      {/* Category filter tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/s/${storeSlug}/products`}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              !categorySlug
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            )}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/s/${storeSlug}/products?category=${cat.slug}`}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                categorySlug === cat.slug
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={store.slug} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-base font-medium">
            {categorySlug ? "No products in this category" : "No products yet"}
          </p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </main>
  )
}
