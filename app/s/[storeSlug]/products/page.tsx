import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/store/ProductCard"

interface ProductsPageProps {
  params: Promise<{ storeSlug: string }>
}

export default async function StoreProductsPage({ params }: ProductsPageProps) {
  const { storeSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", storeSlug)
    .single()

  if (!store) notFound()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-xl font-semibold text-foreground">All Products</h1>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={store.slug} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-base font-medium">No products yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </main>
  )
}
