import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { WhatsAppButton } from "@/components/store/WhatsAppButton"
import { Package } from "lucide-react"

interface ProductPageProps {
  params: Promise<{ storeSlug: string; productSlug: string }>
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
    .single()

  if (!product) notFound()

  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${storeSlug}/${productSlug}`

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground/20" />
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.slice(1).map((img: string, i: number) => (
                <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 border border-border">
                  <Image src={img} alt={`${product.title} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground text-balance">{product.title}</h1>
            <p className="text-3xl font-bold text-whatsapp">
              &#8377;{product.price.toLocaleString("en-IN")}
            </p>
          </div>

          {product.description && (
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Description</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          <WhatsAppButton
            phone={store.whatsapp_number}
            productTitle={product.title}
            price={product.price}
            productUrl={productUrl}
          />
        </div>
      </div>
    </main>
  )
}
