import { cache } from "react"
import { createPublicClient } from "@/lib/supabase/public"
import { createClient } from "@/lib/supabase/server"
import type { Store, Product, Category, AnalyticsEvent } from "@/types"

// ============================================================
// PUBLIC STOREFRONT QUERIES
// Uses createPublicClient() — no cookie reads → ISR-compatible.
// Wrapped in React cache() to deduplicate within one render cycle
// (layout + page + generateMetadata all share one DB round-trip).
// ============================================================

export const getStoreBySlug = cache(async (slug: string): Promise<Store | null> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_deleted", false)
    .single()

  if (error) {
    if (error.code !== "PGRST116") console.error("[queries] getStoreBySlug error:", error.message)
    return null
  }

  return data as Store
})

export const getCategoriesByStoreId = cache(async (storeId: string): Promise<Category[]> => {
  const supabase = createPublicClient()
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
})

export const getActiveProductsByStoreId = cache(async (storeId: string): Promise<Product[]> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, title, slug, price, images, is_featured, is_active, category_id, store_id, description, created_at, updated_at")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .eq("admin_hidden", false)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("[queries] getActiveProductsByStoreId error:", error.message)
    return []
  }

  return data as Product[]
})

export const getFeaturedProducts = cache(async (storeId: string, limit = 8): Promise<Product[]> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, title, slug, price, images, is_featured, is_active, category_id, store_id, description, created_at, updated_at")
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
})

export const getProductBySlug = cache(async (storeId: string, slug: string): Promise<Product | null> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error) {
    if (error.code !== "PGRST116") console.error("[queries] getProductBySlug error:", error.message)
    return null
  }

  return data as Product
})

// ============================================================
// DASHBOARD QUERIES (authenticated — uses cookie-based server client)
// NOT wrapped in cache() — per-user data must always be fresh.
// ============================================================

export async function getStoreByOwnerId(ownerId: string): Promise<Store | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("[queries] getStoreByOwnerId error:", error.message)
    return null
  }

  return data as Store | null
}

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
// ANALYTICS QUERIES (authenticated dashboard — O(1) SQL aggregation)
// ============================================================

export async function getAnalyticsDetails(storeId: string): Promise<{
  allTime: { views: number; productViews: number; waClicks: number }
  last7d: { views: number; productViews: number; waClicks: number }
  last30d: { views: number; productViews: number; waClicks: number }
}> {
  const empty = { views: 0, productViews: 0, waClicks: 0 }
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_analytics_summary", {
    p_store_id: storeId,
  })

  if (error || !data) {
    console.error("[queries] getAnalyticsDetails error:", error?.message)
    return { allTime: empty, last7d: empty, last30d: empty }
  }

  return data as {
    allTime: { views: number; productViews: number; waClicks: number }
    last7d: { views: number; productViews: number; waClicks: number }
    last30d: { views: number; productViews: number; waClicks: number }
  }
}

export async function getAnalyticsSummary(storeId: string): Promise<{
  totalViews: number
  totalClicks: number
  productViews: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_analytics_summary", {
    p_store_id: storeId,
  })

  if (error || !data) {
    console.error("[queries] getAnalyticsSummary error:", error?.message)
    return { totalViews: 0, totalClicks: 0, productViews: 0 }
  }

  const result = data as {
    allTime: { views: number; productViews: number; waClicks: number }
  }

  return {
    totalViews: result.allTime.views,
    totalClicks: result.allTime.waClicks,
    productViews: result.allTime.productViews,
  }
}

export async function getTopProductsByClicks(
  storeId: string,
  limit = 5
): Promise<Array<{ productId: string; title: string; clicks: number }>> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_top_products_by_clicks", {
    p_store_id: storeId,
    p_limit: limit,
  })

  if (error || !data) {
    console.error("[queries] getTopProductsByClicks error:", error?.message)
    return []
  }

  return (data as Array<{ product_id: string; title: string; clicks: number }>).map((r) => ({
    productId: r.product_id,
    title: r.title,
    clicks: Number(r.clicks),
  }))
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function buildWhatsAppUrl(
  phone: string,
  product: Product,
  productUrl: string
): string {
  const message = `Hi! I'm interested in:\n\n*${product.title}*\nPrice: ₹${product.price.toLocaleString("en-IN")}\n\n${productUrl}`
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function buildStoreWhatsAppUrl(phone: string, storeName: string): string {
  const message = `Hi! I found your store "${storeName}" and wanted to ask about your products.`
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
}
