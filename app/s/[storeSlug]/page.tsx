import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/store/ProductCard"
import { ArrowRight } from "lucide-react"

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

  const { data: featured } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_featured", true)
    .limit(8)
    .order("created_at", { ascending: false })

  const { data: allProducts } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .limit(8)
    .order("created_at", { ascending: false })

  const displayProducts = (featured && featured.length > 0 ? featured : allProducts) ?? []

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

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Store header */}
        <div className="text-center space-y-2">
          {store.logo_url && (
            <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto border-4 border-background shadow-md -mt-14">
              <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground text-balance">{store.name}</h1>
        </div>

        {/* Products */}
        {displayProducts.length > 0 ? (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {featured && featured.length > 0 ? "Featured Products" : "Products"}
              </h2>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-whatsapp hover:text-whatsapp">
                <Link href={`/s/${store.slug}/products`}>
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={store.slug} />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-base font-medium">No products yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        )}
      </div>
    </main>
  )
}
