import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StoreNavbar } from "@/components/store/StoreNavbar"
import { StoreUnavailable } from "@/components/store/StoreUnavailable"
import type { Metadata } from "next"

interface StoreLayoutProps {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}

export async function generateMetadata({ params }: StoreLayoutProps): Promise<Metadata> {
  const { storeSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("name, tagline")
    .eq("slug", storeSlug)
    .single()

  if (!store) {
    return { title: "Store Not Found" }
  }

  return {
    title: store.name,
    description: store.tagline || `Shop at ${store.name} - Order via WhatsApp`,
  }
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { storeSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", storeSlug)
    .single()

  if (!store) notFound()

  // Check if store is blocked or paused
  if (store.is_blocked || store.status === "blocked" || store.status === "paused") {
    return <StoreUnavailable />
  }

  // Apply theme via data attribute
  const theme = store.theme_id || "minimal"

  return (
    <div 
      className="min-h-screen storefront-theme" 
      data-theme={theme}
      style={{
        backgroundColor: "var(--store-bg)",
        color: "var(--store-text)",
      }}
    >
      <StoreNavbar store={store} theme={theme} />
      {children}
    </div>
  )
}
