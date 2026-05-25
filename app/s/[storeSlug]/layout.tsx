import { notFound } from "next/navigation"
import { after } from "next/server"
import { Nunito } from "next/font/google"
import { getStoreBySlug } from "@/lib/queries"
import { StoreNavbar } from "@/components/store/StoreNavbar"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreUnavailable } from "@/components/store/StoreUnavailable"
import { createPublicClient } from "@/lib/supabase/public"
import { getThemeConfig, buildThemeCssVars } from "@/lib/themes"
import type { Metadata } from "next"

// Nunito: rounded, friendly — matches the soft pooki aesthetic of the minimal theme.
// Declared at module level as required by next/font.
const nunito = Nunito({ subsets: ["latin"], display: "swap" })

// ISR: regenerate at most once per minute per store slug.
// On-demand revalidation fires via revalidatePath() when seller updates store/products.
export const revalidate = 60

interface StoreLayoutProps {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}

export async function generateMetadata({ params }: StoreLayoutProps): Promise<Metadata> {
  const { storeSlug } = await params
  // getStoreBySlug is wrapped in React cache() — shared with StoreLayout below (1 DB query total)
  const store = await getStoreBySlug(storeSlug)

  if (!store) {
    return { title: "Store Not Found" }
  }

  const ogImage = store.banner_url || store.logo_url
  const description = store.tagline || `Shop at ${store.name} - Order via WhatsApp`

  return {
    title: store.name,
    description,
    openGraph: {
      title: store.name,
      description,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: store.name }] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: store.name,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { storeSlug } = await params
  // Same cache() call — returns the memoized result from generateMetadata, no extra DB query
  const store = await getStoreBySlug(storeSlug)

  if (!store) notFound()

  if (store.is_blocked || store.status === "blocked" || store.status === "paused") {
    return <StoreUnavailable />
  }

  // Track store view after response is sent (reliable in serverless, non-blocking)
  after(async () => {
    const supabase = createPublicClient()
    await supabase.from("analytics_events").insert({
      store_id: store.id,
      event_type: "view",
    })
  })

  const themeId = store.theme_id || "minimal"
  const themeConfig = getThemeConfig(themeId)
  const cssVars = buildThemeCssVars(themeConfig.colors)

  return (
    <>
      <style>{`[data-theme="${themeId}"]{${cssVars}}`}</style>
      <div
        className={`min-h-screen storefront-theme ${nunito.className}`}
        data-theme={themeId}
        style={{
          backgroundColor: "var(--store-bg)",
          color: "var(--store-text)",
        }}
      >
        <StoreNavbar store={store} theme={themeId} />
        {children}
        <StoreFooter storeName={store.name} whatsappNumber={store.whatsapp_number} />
      </div>
    </>
  )
}
