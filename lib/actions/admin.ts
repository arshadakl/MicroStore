"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { extendTrialSchema, storeActionSchema } from "@/lib/validations"
import { ERROR_MESSAGES, ROUTES, TRIAL_CONFIG } from "@/lib/constants"
import { isAdminUser } from "@/lib/supabase/roles"
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
}

export type StoreWithProductCount = Store & {
  products: { count: number }[]
}

// ============================================================
// ADMIN VERIFICATION
// ============================================================

/**
 * Verify that the current user is an admin.
 * Prefers app_metadata.role and keeps user_metadata.role as fallback.
 */
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
// STORE MANAGEMENT ACTIONS
// ============================================================

/**
 * Block a store
 * - Prevents store from appearing on public storefront
 * - Prevents seller from adding products
 */
export async function blockStore(storeId: string): Promise<ActionResult> {
  // Step 1: Validate input
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message }
  }

  // Step 2: Verify admin
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 3: Update store
  const { error: updateError } = await supabase
    .from("stores")
    .update({
      is_blocked: true,
      status: "blocked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)

  if (updateError) {
    console.error("[blockStore] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 4: Revalidate and return
  revalidatePath(ROUTES.ADMIN_STORES)

  return { success: true }
}

/**
 * Pause a store
 * - Store is hidden from public but not permanently blocked
 * - Used for temporary suspension (e.g., non-payment)
 */
export async function pauseStore(storeId: string): Promise<ActionResult> {
  // Step 1: Validate input
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message }
  }

  // Step 2: Verify admin
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 3: Update store
  const { error: updateError } = await supabase
    .from("stores")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)

  if (updateError) {
    console.error("[pauseStore] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 4: Revalidate and return
  revalidatePath(ROUTES.ADMIN_STORES)

  return { success: true }
}

/**
 * Activate a store
 * - Sets status to 'active' and clears blocked flag
 * - Used when seller has paid or been reinstated
 */
export async function activateStore(storeId: string): Promise<ActionResult> {
  // Step 1: Validate input
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message }
  }

  // Step 2: Verify admin
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 3: Update store
  const { error: updateError } = await supabase
    .from("stores")
    .update({
      is_blocked: false,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)

  if (updateError) {
    console.error("[activateStore] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 4: Revalidate and return
  revalidatePath(ROUTES.ADMIN_STORES)

  return { success: true }
}

/**
 * Extend a store's trial period
 * - Adds specified number of days to trial_ends_at
 * - Sets status back to 'trial' and clears blocked flag
 */
export async function extendTrial(
  storeId: string,
  days: number
): Promise<ActionResult> {
  // Step 1: Validate input
  const validation = extendTrialSchema.safeParse({ storeId, days })
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message }
  }

  // Step 2: Verify admin
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 3: Get current store data
  const { data: store, error: fetchError } = await supabase
    .from("stores")
    .select("trial_ends_at")
    .eq("id", storeId)
    .single()

  if (fetchError || !store) {
    return { success: false, error: ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  // Step 4: Calculate new trial end date
  const currentEndDate = store.trial_ends_at
    ? new Date(store.trial_ends_at)
    : new Date()
  const newEndDate = new Date(currentEndDate)
  newEndDate.setDate(newEndDate.getDate() + days)

  // Step 5: Update store
  const { error: updateError } = await supabase
    .from("stores")
    .update({
      trial_ends_at: newEndDate.toISOString(),
      status: "trial",
      is_blocked: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)

  if (updateError) {
    console.error("[extendTrial] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 6: Revalidate and return
  revalidatePath(ROUTES.ADMIN_STORES)

  return { success: true }
}

/**
 * Delete a store and all its data
 * - Deletes all products, analytics, and the store itself
 * - This action is irreversible
 */
export async function deleteStore(storeId: string): Promise<ActionResult> {
  // Step 1: Validate input
  const validation = storeActionSchema.safeParse({ storeId })
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message }
  }

  // Step 2: Verify admin
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { success: false, error: adminError || ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 3: Delete products (CASCADE should handle this, but be explicit)
  const { error: productsError } = await supabase
    .from("products")
    .delete()
    .eq("store_id", storeId)

  if (productsError) {
    console.error("[deleteStore] Products error:", productsError)
    return { success: false, error: "Failed to delete store products" }
  }

  // Step 4: Delete analytics events
  const { error: analyticsError } = await supabase
    .from("analytics_events")
    .delete()
    .eq("store_id", storeId)

  if (analyticsError) {
    console.error("[deleteStore] Analytics error:", analyticsError)
    // Don't fail on analytics deletion
  }

  // Step 5: Delete store
  const { error: deleteError } = await supabase
    .from("stores")
    .delete()
    .eq("id", storeId)

  if (deleteError) {
    console.error("[deleteStore] Error:", deleteError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 6: Revalidate and return
  revalidatePath(ROUTES.ADMIN_STORES)

  return { success: true }
}

// ============================================================
// ADMIN DATA FETCHING
// ============================================================

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<{
  stats: AdminStats | null
  error: string | null
}> {
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { stats: null, error: adminError }
  }

  const supabase = await createClient()

  // Fetch stores and products in parallel
  const [storesResult, productsResult] = await Promise.all([
    supabase.from("stores").select("id, status, trial_ends_at, is_blocked"),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ])

  const stores = storesResult.data || []
  const totalProducts = productsResult.count || 0

  // Calculate expiring soon threshold
  const now = new Date()
  const warningThreshold = new Date()
  warningThreshold.setDate(now.getDate() + TRIAL_CONFIG.WARNING_DAYS)

  // Calculate stats
  const stats: AdminStats = {
    totalSellers: stores.length,
    totalStores: stores.length,
    totalProducts,
    activeStores: stores.filter(
      (s) => s.status === "active" && !s.is_blocked
    ).length,
    trialStores: stores.filter((s) => s.status === "trial").length,
    blockedStores: stores.filter(
      (s) => s.is_blocked || s.status === "blocked"
    ).length,
    pausedStores: stores.filter((s) => s.status === "paused").length,
    trialExpiringSoon: stores.filter((s) => {
      if (s.status !== "trial" || !s.trial_ends_at) return false
      const endDate = new Date(s.trial_ends_at)
      return endDate <= warningThreshold && endDate >= now
    }).length,
  }

  return { stats, error: null }
}

/**
 * Get all stores with product counts
 */
export async function getAllStores(): Promise<{
  stores: StoreWithProductCount[] | null
  error: string | null
}> {
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { stores: null, error: adminError }
  }

  const supabase = await createClient()

  const { data: stores, error } = await supabase
    .from("stores")
    .select(
      `
      *,
      products:products(count)
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getAllStores] Error:", error)
    return { stores: null, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  return { stores: stores as StoreWithProductCount[], error: null }
}

/**
 * Get a single store with all its products
 */
export async function getStoreWithProducts(storeId: string): Promise<{
  store: Store | null
  products: Product[]
  error: string | null
}> {
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { store: null, products: [], error: adminError }
  }

  const supabase = await createClient()

  // Fetch store and products in parallel
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

/**
 * Get all products across all stores
 */
export async function getAllProducts(): Promise<{
  products: ProductWithStore[] | null
  error: string | null
}> {
  const { isAdmin, error: adminError } = await verifyAdmin()
  if (!isAdmin) {
    return { products: null, error: adminError }
  }

  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      *,
      store:stores(id, name, slug)
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getAllProducts] Error:", error)
    return { products: null, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  return { products: products as ProductWithStore[], error: null }
}
