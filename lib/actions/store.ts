"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  storeOnboardingSchema,
  storeSettingsSchema,
  generateSlug,
  sanitizeString,
  type StoreOnboardingInput,
  type StoreSettingsInput,
} from "@/lib/validations"
import { TRIAL_CONFIG, ERROR_MESSAGES, ROUTES } from "@/lib/constants"
import type { Store } from "@/types"

// ============================================================
// TYPES
// ============================================================

export type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

/**
 * Get the currently authenticated user
 * Returns null if not authenticated
 */
async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  return { user, error: null }
}

/**
 * Verify that a user owns a specific store
 */
async function verifyStoreOwnership(
  storeId: string,
  userId: string
): Promise<{ isOwner: boolean; slug?: string }> {
  const supabase = await createClient()
  const { data: store } = await supabase
    .from("stores")
    .select("id, owner_id, slug")
    .eq("id", storeId)
    .single()

  if (!store || store.owner_id !== userId) {
    return { isOwner: false }
  }

  return { isOwner: true, slug: store.slug }
}

// ============================================================
// STORE ACTIONS
// ============================================================

/**
 * Create a new store for the authenticated user
 * - Validates input with Zod
 * - Checks user doesn't already have a store
 * - Generates unique slug
 * - Sets trial period
 */
export async function createStore(
  input: StoreOnboardingInput
): Promise<ActionResult<{ storeId: string; slug: string }>> {
  // Step 1: Validate input
  const validation = storeOnboardingSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || ERROR_MESSAGES.VALIDATION_ERROR,
    }
  }

  // Step 2: Verify authentication
  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: authError || ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  const supabase = await createClient()

  // Step 3: Check if user already has a store
  const { data: existingStore } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (existingStore) {
    return { success: false, error: ERROR_MESSAGES.STORE_ALREADY_EXISTS }
  }

  // Step 4: Generate unique slug
  let slug = generateSlug(validation.data.name)
  let slugSuffix = 0
  let isSlugUnique = false

  while (!isSlugUnique) {
    const checkSlug = slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug
    const { data: existingSlug } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", checkSlug)
      .single()

    if (!existingSlug) {
      slug = checkSlug
      isSlugUnique = true
    } else {
      slugSuffix++
    }
  }

  // Step 5: Calculate trial end date
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_CONFIG.TRIAL_DAYS)

  // Step 6: Create store
  const { data: store, error: createError } = await supabase
    .from("stores")
    .insert({
      owner_id: user.id,
      name: sanitizeString(validation.data.name),
      slug,
      whatsapp_number: sanitizeString(validation.data.whatsappNumber),
      status: "trial",
      trial_ends_at: trialEndsAt.toISOString(),
      is_blocked: false,
      theme_id: "minimal",
    })
    .select("id, slug")
    .single()

  if (createError || !store) {
    console.error("[createStore] Error:", createError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 7: Revalidate and return
  revalidatePath(ROUTES.DASHBOARD)
  revalidatePath(`/s/${store.slug}`)

  return {
    success: true,
    data: { storeId: store.id, slug: store.slug },
  }
}

/**
 * Update an existing store's settings
 * - Validates input with Zod
 * - Verifies ownership
 */
export async function updateStore(
  storeId: string,
  input: StoreSettingsInput
): Promise<ActionResult> {
  // Step 1: Validate input
  const validation = storeSettingsSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || ERROR_MESSAGES.VALIDATION_ERROR,
    }
  }

  // Step 2: Verify authentication
  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: authError || ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  // Step 3: Verify ownership
  const { isOwner, slug: storeSlug } = await verifyStoreOwnership(storeId, user.id)
  if (!isOwner) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 4: Update store
  const { error: updateError } = await supabase
    .from("stores")
    .update({
      name: sanitizeString(validation.data.name),
      whatsapp_number: sanitizeString(validation.data.whatsappNumber),
      tagline: validation.data.tagline
        ? sanitizeString(validation.data.tagline)
        : null,
      logo_url: validation.data.logoUrl || null,
      banners: validation.data.banners.map((b) => ({
        id: b.id,
        image_url: b.image_url || "",
        title: b.title ? sanitizeString(b.title) : "",
        subtitle: b.subtitle ? sanitizeString(b.subtitle) : "",
        link: b.link || "",
      })),
      theme_id: validation.data.themeId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)

  if (updateError) {
    console.error("[updateStore] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 5: Revalidate dashboard + storefront ISR cache
  revalidatePath(ROUTES.DASHBOARD)
  revalidatePath(ROUTES.DASHBOARD_SETTINGS)
  if (storeSlug) revalidatePath(`/s/${storeSlug}`)

  return { success: true }
}

/**
 * Get the authenticated user's store
 * Returns null if user has no store yet
 */
export async function getMyStore(): Promise<{
  store: Store | null
  error: string | null
}> {
  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { store: null, error: authError }
  }

  const supabase = await createClient()
  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  // PGRST116 = no rows returned (user doesn't have a store yet)
  if (error && error.code !== "PGRST116") {
    console.error("[getMyStore] Error:", error)
    return { store: null, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  return { store: store as Store | null, error: null }
}

/**
 * Check if a store is accessible (not blocked or paused)
 */
export async function checkStoreAccess(storeId: string): Promise<{
  canAccess: boolean
  reason?: string
}> {
  const supabase = await createClient()
  const { data: store, error } = await supabase
    .from("stores")
    .select("status, is_blocked")
    .eq("id", storeId)
    .single()

  if (error || !store) {
    return { canAccess: false, reason: ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  if (store.is_blocked || store.status === "blocked") {
    return { canAccess: false, reason: ERROR_MESSAGES.STORE_BLOCKED }
  }

  if (store.status === "paused") {
    return { canAccess: false, reason: ERROR_MESSAGES.STORE_UNAVAILABLE }
  }

  return { canAccess: true }
}
