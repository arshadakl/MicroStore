"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  extendTrialSchema,
  storeActionSchema,
  convertToRegularSchema,
  productAdminActionSchema,
} from "@/lib/validations"
import { ERROR_MESSAGES, ROUTES, TRIAL_CONFIG, SUBSCRIPTION_CONFIG } from "@/lib/constants"
import { isAdminUser } from "@/lib/supabase/roles"
import { deleteCloudinaryImages } from "@/lib/cloudinary-server"
import type { Store, Product, ProductWithStore } from "@/types"

// ============================================================
// TYPES
// ============================================================

export type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

export type AdminStats = {
  totalSellers: number
  totalStores: number
  totalProducts: number
  activeStores: number
  trialStores: number
  blockedStores: number
  pausedStores: number
  trialExpiringSoon: number
  subscriptionExpiringSoon: number
  trashedStores: number
}

export type StoreWithProductCount = Store & {
  products: { count: number }[]
}

// ============================================================
// ADMIN VERIFICATION
// ============================================================

async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { isAdmin: false, user: null, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  const isAdmin = isAdminUser(user)
  if (!isAdmin) {
    return { isAdmin: false, user: null, error: ERROR_MESSAGES.UNAUTHORIZED }
  }

  return { isAdmin: true, user, error: null }
}

// ============================================================
// STORE STATUS ACTIONS
// ============================================================

export async function blockStore(storeId: string): Promise<ActionResult> {
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()
  const { error } = await supabase
    .from("stores")
    .update({ is_blocked: true, status: "blocked", updated_at: new Date().toISOString() })
    .eq("id", storeId)
    .eq("is_deleted", false)

  if (error) {
    console.error("[blockStore]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

export async function unblockStore(storeId: string): Promise<ActionResult> {
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("status, subscription_ends_at")
    .eq("id", storeId)
    .single()

  // Restore to appropriate status: if it had a subscription, go active; else trial
  const prevStatus = store?.status === "blocked" ? "active" : store?.status ?? "active"
  const newStatus = prevStatus === "blocked" ? "active" : prevStatus

  const { error } = await supabase
    .from("stores")
    .update({ is_blocked: false, status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", storeId)

  if (error) {
    console.error("[unblockStore]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

export async function pauseStore(storeId: string): Promise<ActionResult> {
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()
  const { error } = await supabase
    .from("stores")
    .update({ status: "paused", updated_at: new Date().toISOString() })
    .eq("id", storeId)
    .eq("is_deleted", false)

  if (error) {
    console.error("[pauseStore]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

export async function activateStore(storeId: string): Promise<ActionResult> {
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()
  const { error } = await supabase
    .from("stores")
    .update({ is_blocked: false, status: "active", updated_at: new Date().toISOString() })
    .eq("id", storeId)
    .eq("is_deleted", false)

  if (error) {
    console.error("[activateStore]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

// ============================================================
// TRIAL & SUBSCRIPTION ACTIONS
// ============================================================

export async function extendTrial(storeId: string, days: number): Promise<ActionResult> {
  const validation = extendTrialSchema.safeParse({ storeId, days })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()
  const { data: store, error: fetchError } = await supabase
    .from("stores")
    .select("trial_ends_at")
    .eq("id", storeId)
    .single()

  if (fetchError || !store) return { success: false, error: ERROR_MESSAGES.STORE_NOT_FOUND }

  const base = store.trial_ends_at ? new Date(store.trial_ends_at) : new Date()
  if (base < new Date()) base.setTime(new Date().getTime()) // extend from now if already expired
  base.setDate(base.getDate() + days)

  const { error } = await supabase
    .from("stores")
    .update({
      trial_ends_at: base.toISOString(),
      status: "trial",
      is_blocked: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)

  if (error) {
    console.error("[extendTrial]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

export async function convertToRegular(
  storeId: string,
  endsAt: string
): Promise<ActionResult> {
  const validation = convertToRegularSchema.safeParse({ storeId, endsAt })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const subscriptionEndsAt = new Date(endsAt)
  subscriptionEndsAt.setHours(23, 59, 59, 999)

  const supabase = await createClient()
  const { error } = await supabase
    .from("stores")
    .update({
      status: "active",
      is_blocked: false,
      subscription_ends_at: subscriptionEndsAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .eq("is_deleted", false)

  if (error) {
    console.error("[convertToRegular]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

export async function setSubscription(storeId: string, endsAt: string): Promise<ActionResult> {
  const validation = convertToRegularSchema.safeParse({ storeId, endsAt })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const subscriptionEndsAt = new Date(endsAt)
  subscriptionEndsAt.setHours(23, 59, 59, 999)

  const supabase = await createClient()
  const { error } = await supabase
    .from("stores")
    .update({
      subscription_ends_at: subscriptionEndsAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .eq("is_deleted", false)

  if (error) {
    console.error("[setSubscription]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

// ============================================================
// PRODUCT ADMIN ACTIONS
// ============================================================

export async function toggleProductAdminHidden(productId: string): Promise<ActionResult> {
  const validation = productAdminActionSchema.safeParse({ productId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("admin_hidden, store_id")
    .eq("id", productId)
    .single()

  if (fetchError || !product) return { success: false, error: ERROR_MESSAGES.PRODUCT_NOT_FOUND }

  const { error } = await supabase
    .from("products")
    .update({ admin_hidden: !product.admin_hidden, updated_at: new Date().toISOString() })
    .eq("id", productId)

  if (error) {
    console.error("[toggleProductAdminHidden]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  revalidatePath(ROUTES.adminStoreDetail(product.store_id))
  return { success: true, data: !product.admin_hidden as unknown as void }
}

// ============================================================
// SOFT DELETE & RESTORE
// ============================================================

export async function softDeleteStore(storeId: string): Promise<ActionResult> {
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()

  // Collect all product image URLs before deleting
  const { data: products } = await supabase
    .from("products")
    .select("images")
    .eq("store_id", storeId)

  const { data: store } = await supabase
    .from("stores")
    .select("logo_url, banner_url")
    .eq("id", storeId)
    .single()

  // Soft-delete the store
  const { error } = await supabase
    .from("stores")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)

  if (error) {
    console.error("[softDeleteStore]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Delete Cloudinary images in background (non-blocking for UX)
  const imageUrls: string[] = []
  if (store?.logo_url) imageUrls.push(store.logo_url)
  if (store?.banner_url) imageUrls.push(store.banner_url)
  for (const p of products ?? []) {
    if (Array.isArray(p.images)) imageUrls.push(...p.images)
  }
  // Fire-and-forget: deletion failure should not block the soft delete
  deleteCloudinaryImages(imageUrls).catch((e) =>
    console.error("[softDeleteStore] Cloudinary cleanup error:", e)
  )

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

export async function restoreStore(storeId: string): Promise<ActionResult> {
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()
  const { error } = await supabase
    .from("stores")
    .update({
      is_deleted: false,
      deleted_at: null,
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)

  if (error) {
    console.error("[restoreStore]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

export async function purgeStore(storeId: string): Promise<ActionResult> {
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()

  const { error: deleteError } = await supabase.from("stores").delete().eq("id", storeId)

  if (deleteError) {
    console.error("[purgeStore]", deleteError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

// Keep old deleteStore as alias for purgeStore (hard delete, used for non-trashed stores)
export async function deleteStore(storeId: string): Promise<ActionResult> {
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }

  const supabase = await createClient()

  // Collect images before deletion
  const { data: products } = await supabase
    .from("products")
    .select("images")
    .eq("store_id", storeId)

  const { data: store } = await supabase
    .from("stores")
    .select("logo_url, banner_url")
    .eq("id", storeId)
    .single()

  const { error: analyticsError } = await supabase
    .from("analytics_events")
    .delete()
    .eq("store_id", storeId)

  if (analyticsError) console.error("[deleteStore] Analytics error:", analyticsError)

  const { error } = await supabase.from("stores").delete().eq("id", storeId)

  if (error) {
    console.error("[deleteStore]", error)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  const imageUrls: string[] = []
  if (store?.logo_url) imageUrls.push(store.logo_url)
  if (store?.banner_url) imageUrls.push(store.banner_url)
  for (const p of products ?? []) {
    if (Array.isArray(p.images)) imageUrls.push(...p.images)
  }
  deleteCloudinaryImages(imageUrls).catch((e) =>
    console.error("[deleteStore] Cloudinary cleanup error:", e)
  )

  revalidatePath(ROUTES.ADMIN_STORES)
  return { success: true }
}

// ============================================================
// ADMIN DATA FETCHING
// ============================================================

export async function getAdminStats(): Promise<{
  stats: AdminStats | null
  error: string | null
}> {
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { stats: null, error: adminError }

  const supabase = await createClient()

  const [storesResult, productsResult] = await Promise.all([
    supabase
      .from("stores")
      .select("id, status, trial_ends_at, subscription_ends_at, is_blocked, is_deleted"),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ])

  const allStores = storesResult.data || []
  const activeStores = allStores.filter((s) => !s.is_deleted)
  const totalProducts = productsResult.count || 0

  const now = new Date()
  const warningDate = new Date()
  warningDate.setDate(now.getDate() + TRIAL_CONFIG.WARNING_DAYS)

  const subWarningDate = new Date()
  subWarningDate.setDate(now.getDate() + SUBSCRIPTION_CONFIG.WARNING_DAYS)

  const stats: AdminStats = {
    totalSellers: activeStores.length,
    totalStores: activeStores.length,
    totalProducts,
    activeStores: activeStores.filter((s) => s.status === "active" && !s.is_blocked).length,
    trialStores: activeStores.filter((s) => s.status === "trial").length,
    blockedStores: activeStores.filter((s) => s.is_blocked || s.status === "blocked").length,
    pausedStores: activeStores.filter((s) => s.status === "paused").length,
    trialExpiringSoon: activeStores.filter((s) => {
      if (s.status !== "trial" || !s.trial_ends_at) return false
      const end = new Date(s.trial_ends_at)
      return end <= warningDate && end >= now
    }).length,
    subscriptionExpiringSoon: activeStores.filter((s) => {
      if (s.status !== "active" || !s.subscription_ends_at) return false
      const end = new Date(s.subscription_ends_at)
      return end <= subWarningDate && end >= now
    }).length,
    trashedStores: allStores.filter((s) => s.is_deleted).length,
  }

  return { stats, error: null }
}

export async function getAllStores(includeTrashed = false): Promise<{
  stores: StoreWithProductCount[] | null
  error: string | null
}> {
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { stores: null, error: adminError }

  const supabase = await createClient()

  let query = supabase
    .from("stores")
    .select("*, products:products(count)")
    .order("created_at", { ascending: false })

  if (!includeTrashed) {
    query = query.eq("is_deleted", false)
  } else {
    query = query.eq("is_deleted", true)
  }

  const { data: stores, error } = await query

  if (error) {
    console.error("[getAllStores]", error)
    return { stores: null, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  return { stores: stores as StoreWithProductCount[], error: null }
}

export async function getStoreWithProducts(storeId: string): Promise<{
  store: Store | null
  products: Product[]
  error: string | null
}> {
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { store: null, products: [], error: adminError }

  const supabase = await createClient()

  const [storeResult, productsResult] = await Promise.all([
    supabase.from("stores").select("*").eq("id", storeId).single(),
    supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false }),
  ])

  if (storeResult.error) {
    return { store: null, products: [], error: ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  return {
    store: storeResult.data as Store,
    products: (productsResult.data as Product[]) || [],
    error: null,
  }
}

export async function getAllProducts(): Promise<{
  products: ProductWithStore[] | null
  error: string | null
}> {
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) return { products: null, error: adminError }

  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from("products")
    .select("*, store:stores(id, name, slug)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getAllProducts]", error)
    return { products: null, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  return { products: products as ProductWithStore[], error: null }
}
