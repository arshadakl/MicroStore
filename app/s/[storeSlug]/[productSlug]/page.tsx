import { notFound } from "next/navigation"
import { after } from "next/server"
import Link from "next/link"
import { getStoreBySlug, getProductBySlug } from "@/lib/queries"
import { createPublicClient } from "@/lib/supabase/public"
import { ImageGallery } from "@/components/store/ImageGallery"
import { WhatsAppButton } from "@/components/store/WhatsAppButton"
import type { Metadata } from "next"

export const revalidate = 60

interface ProductPageProps {
  params: Promise<{ storeSlug: string; productSlug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { storeSlug, productSlug } = await params

  // cache()-memoized — shares result with ProductPage below (no extra DB queries)
  const store = await getStoreBySlug(storeSlug)
  if (!store) return {}

  const prod = await getProductBySlug(store.id, productSlug)
  if (!prod) return {}

  const price = `₹${Number(prod.price).toLocaleString("en-IN")}`
  const description = prod.description
    ? `${prod.description.slice(0, 150)} — ${price}`
    : `${price} · Order via WhatsApp from ${store.name}`
  const ogImage = prod.images?.[0]

  return {
    title: `${prod.title} — ${store.name}`,
    description,
    openGraph: {
      title: `${prod.title} — ${price}`,
      description,
      ...(ogImage && { images: [{ url: ogImage, width: 800, height: 800, alt: prod.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${prod.title} — ${price}`,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { storeSlug, productSlug } = await params

  // cache()-memoized — layout, generateMetadata, and this function all share results
  const store = await getStoreBySlug(storeSlug)
  if (!store) notFound()

  const product = await getProductBySlug(store.id, productSlug)
  if (!product) notFound()

  // Track product view after response is sent — non-blocking, reliable in serverless
  after(async () => {
    const supabase = createPublicClient()
    await supabase.from("analytics_events").insert({
      store_id: store.id,
      product_id: product.id,
      event_type: "product_view",
    })
  })

  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${storeSlug}/${productSlug}`

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/s/${storeSlug}`}
        className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--store-text-muted)" }}
      >
        ← Back to store
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <ImageGallery images={product.images ?? []} title={product.title} />

        <div className="space-y-5">
          <div className="space-y-2">
            <h1
              className="font-bold leading-tight"
              style={{
                fontSize: "clamp(22px, 5vw, 32px)",
                color: "var(--store-text)",
              }}
            >
              {product.title}
            </h1>
            <p
              className="font-extrabold"
              style={{ fontSize: "clamp(24px, 5vw, 32px)", color: "var(--store-primary)" }}
            >
              &#8377;{Number(product.price).toLocaleString("en-IN")}
            </p>
          </div>

          {product.description && (
            <div>
              <p
                className="leading-relaxed"
                style={{ fontSize: 15, lineHeight: 1.75, color: "var(--store-text-muted)" }}
              >
                {product.description}
              </p>
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
