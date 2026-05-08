import { createClient } from "@/lib/supabase/server"
import type { Store, Product, Category, AnalyticsEvent } from "@/types"

// ============================================================
// STORE QUERIES
// ============================================================

/**
 * Get a store by its unique slug (used for public storefront)
 */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_deleted", false)
    .single()

  if (error) {
    console.error("[queries] getStoreBySlug error:", error.message)
    return null
  }

  return data as Store
}

/**
 * Get a store by owner user ID (used for dashboard)
 */
export async function getStoreByOwnerId(ownerId: string): Promise<Store | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned (not an error, just no store yet)
    console.error("[queries] getStoreByOwnerId error:", error.message)
    return null
  }

  return data as Store | null
}

// ============================================================
// CATEGORY QUERIES
// ============================================================

export async function getCategoriesByStoreId(storeId: string): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[queries] getCategoriesByStoreId error:", error.message)
    return []
  }

  return data as Category[]
}

// ============================================================
// PRODUCT QUERIES
// ============================================================

/**
 * Get all products for a store (including inactive, for dashboard)
 */
export async function getProductsByStoreId(storeId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[queries] getProductsByStoreId error:", error.message)
    return []
  }

  return data as Product[]
}

/**
 * Get active products for a store (for public storefront)
 */
export async function getActiveProductsByStoreId(storeId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .eq("admin_hidden", false)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[queries] getActiveProductsByStoreId error:", error.message)
    return []
  }

  return data as Product[]
}

/**
 * Get featured products for a store (for homepage showcase)
 */
export async function getFeaturedProducts(
  storeId: string,
  limit = 8
): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_featured", true)
    .eq("is_active", true)
    .eq("admin_hidden", false)
    .limit(limit)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[queries] getFeaturedProducts error:", error.message)
    return []
  }

  return data as Product[]
}

/**
 * Get a single product by slug (within a store)
 */
export async function getProductBySlug(
  storeId: string,
  slug: string
): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("[queries] getProductBySlug error:", error.message)
    return null
  }

  return data as Product
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[queries] getProductById error:", error.message)
    return null
  }

  return data as Product
}

/**
 * Count products for a store
 */
export async function countProductsByStoreId(storeId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)

  if (error) {
    console.error("[queries] countProductsByStoreId error:", error.message)
    return 0
  }

  return count ?? 0
}

// ============================================================
// ANALYTICS QUERIES
// ============================================================

/**
 * Track an analytics event
 */
export async function trackEvent(
  storeId: string,
  eventType: "view" | "click_whatsapp" | "product_view",
  productId?: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("analytics_events").insert({
    store_id: storeId,
    product_id: productId ?? null,
    event_type: eventType,
  })

  if (error) {
    console.error("[queries] trackEvent error:", error.message)
  }
}

/**
 * Get analytics summary for a store
 */
export async function getAnalyticsSummary(storeId: string): Promise<{
  totalViews: number
  totalClicks: number
  productViews: number
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type")
    .eq("store_id", storeId)

  if (error) {
    console.error("[queries] getAnalyticsSummary error:", error.message)
    return { totalViews: 0, totalClicks: 0, productViews: 0 }
  }

  const events = data as Pick<AnalyticsEvent, "event_type">[]

  return {
    totalViews: events.filter((e) => e.event_type === "view").length,
    totalClicks: events.filter((e) => e.event_type === "click_whatsapp").length,
    productViews: events.filter((e) => e.event_type === "product_view").length,
  }
}

/**
 * Get detailed analytics with all-time and last-7-day breakdowns
 */
export async function getAnalyticsDetails(storeId: string): Promise<{
  allTime: { views: number; productViews: number; waClicks: number }
  last7d: { views: number; productViews: number; waClicks: number }
  last30d: { views: number; productViews: number; waClicks: number }
}> {
  const empty = { views: 0, productViews: 0, waClicks: 0 }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, created_at")
    .eq("store_id", storeId)

  if (error || !data) {
    console.error("[queries] getAnalyticsDetails error:", error?.message)
    return { allTime: empty, last7d: empty, last30d: empty }
  }

  const now = Date.now()
  const ms7d = 7 * 24 * 60 * 60 * 1000
  const ms30d = 30 * 24 * 60 * 60 * 1000

  function count(events: NonNullable<typeof data>) {
    return {
      views: events.filter((e) => e.event_type === "view").length,
      productViews: events.filter((e) => e.event_type === "product_view").length,
      waClicks: events.filter((e) => e.event_type === "click_whatsapp").length,
    }
  }

  return {
    allTime: count(data),
    last7d: count(data.filter((e) => now - new Date(e.created_at).getTime() <= ms7d)),
    last30d: count(data.filter((e) => now - new Date(e.created_at).getTime() <= ms30d)),
  }
}

/**
 * Get top products by WhatsApp click count
 */
export async function getTopProductsByClicks(
  storeId: string,
  limit = 5
): Promise<Array<{ productId: string; title: string; clicks: number }>> {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from("analytics_events")
    .select("product_id")
    .eq("store_id", storeId)
    .eq("event_type", "click_whatsapp")
    .not("product_id", "is", null)

  if (!events || events.length === 0) return []

  const counts: Record<string, number> = {}
  for (const e of events) {
    if (e.product_id) counts[e.product_id] = (counts[e.product_id] ?? 0) + 1
  }

  const topIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  if (topIds.length === 0) return []

  const { data: products } = await supabase
    .from("products")
    .select("id, title")
    .in("id", topIds)

  if (!products) return []

  return topIds.map((id) => ({
    productId: id,
    title: products.find((p) => p.id === id)?.title ?? "Unknown",
    clicks: counts[id] ?? 0,
  }))
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Build WhatsApp URL with pre-filled message
 */
export function buildWhatsAppUrl(
  phone: string,
  product: Product,
  productUrl: string
): string {
  const message = `Hi! I'm interested in:\n\n*${product.title}*\nPrice: ₹${product.price.toLocaleString("en-IN")}\n\n${productUrl}`
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Build WhatsApp URL for general store inquiry
 */
export function buildStoreWhatsAppUrl(phone: string, storeName: string): string {
  const message = `Hi! I found your store "${storeName}" and wanted to ask about your products.`
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Format price for display (Indian format)
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`
}

/**
 * Generate a URL-safe slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
}
