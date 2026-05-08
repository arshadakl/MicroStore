import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { trackEvent } from "@/lib/queries"
import { ImageGallery } from "@/components/store/ImageGallery"
import { WhatsAppButton } from "@/components/store/WhatsAppButton"
import type { Metadata } from "next"

interface ProductPageProps {
  params: Promise<{ storeSlug: string; productSlug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { storeSlug, productSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("slug", storeSlug)
    .single()

  if (!store) return {}

  const { data: product } = await supabase
    .from("products")
    .select("title, description, price, images")
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .single()

  if (!product) return {}

  const price = `₹${Number(product.price).toLocaleString("en-IN")}`
  const description = product.description
    ? `${product.description.slice(0, 150)} — ${price}`
    : `${price} · Order via WhatsApp from ${store.name}`
  const ogImage = product.images?.[0]

  return {
    title: `${product.title} — ${store.name}`,
    description,
    openGraph: {
      title: `${product.title} — ${price}`,
      description,
      ...(ogImage && { images: [{ url: ogImage, width: 800, height: 800, alt: product.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} — ${price}`,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { storeSlug, productSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", storeSlug)
    .single()

  if (!store) notFound()

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .eq("is_active", true)
    .single()

  if (!product) notFound()

  void trackEvent(store.id, "product_view", product.id)

  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${storeSlug}/${productSlug}`

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <ImageGallery images={product.images ?? []} title={product.title} />

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground text-balance">{product.title}</h1>
            <p className="text-3xl font-bold text-whatsapp">
              &#8377;{Number(product.price).toLocaleString("en-IN")}
            </p>
          </div>

          {product.description && (
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Description
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          <WhatsAppButton
            phone={store.whatsapp_number}
            productTitle={product.title}
            price={Number(product.price)}
            productUrl={productUrl}
            storeId={store.id}
            productId={product.id}
          />
        </div>
      </div>
    </main>
  )
}
