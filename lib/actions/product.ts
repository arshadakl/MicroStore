"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  productSchema,
  generateSlug,
  sanitizeString,
  type ProductInput,
} from "@/lib/validations"
import { ERROR_MESSAGES, ROUTES, PRODUCT_LIMITS } from "@/lib/constants"

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
 * Get the store for a user, checking it's not blocked
 */
async function getStoreForUser(userId: string) {
  const supabase = await createClient()
  const { data: store, error } = await supabase
    .from("stores")
    .select("id, slug, is_blocked, status")
    .eq("owner_id", userId)
    .single()

  if (error || !store) {
    return { store: null, error: ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  if (store.is_blocked || store.status === "blocked" || store.status === "paused") {
    return { store: null, error: ERROR_MESSAGES.STORE_BLOCKED }
  }

  return { store, error: null }
}

function revalidateStorefront(storeSlug: string) {
  revalidatePath(`/s/${storeSlug}`)
  revalidatePath(`/s/${storeSlug}/products`)
}

/**
 * Verify that a product belongs to a specific store
 */
async function verifyProductOwnership(
  productId: string,
  storeId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from("products")
    .select("id, store_id")
    .eq("id", productId)
    .single()

  if (!product || product.store_id !== storeId) {
    return false
  }

  return true
}

// ============================================================
// PRODUCT ACTIONS
// ============================================================

/**
 * Create a new product
 * - Validates input with Zod
 * - Verifies user has a non-blocked store
 * - Generates unique slug within the store
 */
export async function createProduct(
  input: ProductInput
): Promise<ActionResult<{ productId: string; slug: string }>> {
  // Step 1: Validate input
  const validation = productSchema.safeParse(input)
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

  // Step 3: Get user's store (and verify not blocked)
  const { store, error: storeError } = await getStoreForUser(user.id)
  if (!store) {
    return { success: false, error: storeError || ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  const supabase = await createClient()

  // Step 4: Enforce product count limit (M3)
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)

  const limit =
    store.status === "active"
      ? PRODUCT_LIMITS.MAX_PRODUCTS_PAID
      : PRODUCT_LIMITS.MAX_PRODUCTS_FREE

  if ((productCount ?? 0) >= limit) {
    return { success: false, error: ERROR_MESSAGES.PRODUCT_LIMIT_REACHED }
  }

  // Step 5: Verify category belongs to this store (if provided)
  if (validation.data.categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("id", validation.data.categoryId)
      .eq("store_id", store.id)
      .single()
    if (!cat) {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
    }
  }

  // Step 6: Generate unique slug within the store
  let slug = generateSlug(validation.data.title)
  let slugSuffix = 0
  let isSlugUnique = false

  while (!isSlugUnique) {
    const checkSlug = slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug
    const { data: existingSlug } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", store.id)
      .eq("slug", checkSlug)
      .single()

    if (!existingSlug) {
      slug = checkSlug
      isSlugUnique = true
    } else {
      slugSuffix++
    }
  }

  // Step 6: Create product
  const { data: product, error: createError } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      category_id: validation.data.categoryId ?? null,
      title: sanitizeString(validation.data.title),
      slug,
      description: validation.data.description
        ? sanitizeString(validation.data.description)
        : null,
      price: validation.data.price,
      images: validation.data.images || [],
      is_featured: validation.data.isFeatured,
      is_active: validation.data.isActive,
    })
    .select("id, slug")
    .single()

  if (createError || !product) {
    console.error("[createProduct] Error:", createError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 7: Revalidate dashboard + storefront ISR cache
  revalidatePath(ROUTES.DASHBOARD_PRODUCTS)
  revalidateStorefront(store.slug)

  return {
    success: true,
    data: { productId: product.id, slug: product.slug },
  }
}

/**
 * Update an existing product
 * - Validates input with Zod
 * - Verifies ownership
 */
export async function updateProduct(
  productId: string,
  input: ProductInput
): Promise<ActionResult> {
  // Step 1: Validate input
  const validation = productSchema.safeParse(input)
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

  // Step 3: Get user's store
  const { store, error: storeError } = await getStoreForUser(user.id)
  if (!store) {
    return { success: false, error: storeError || ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  // Step 4: Verify ownership
  const isOwner = await verifyProductOwnership(productId, store.id)
  if (!isOwner) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 5: Verify category belongs to this store (if provided)
  if (validation.data.categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("id", validation.data.categoryId)
      .eq("store_id", store.id)
      .single()
    if (!cat) {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
    }
  }

  // Step 6: Update product
  const { error: updateError } = await supabase
    .from("products")
    .update({
      category_id: validation.data.categoryId ?? null,
      title: sanitizeString(validation.data.title),
      description: validation.data.description
        ? sanitizeString(validation.data.description)
        : null,
      price: validation.data.price,
      images: validation.data.images || [],
      is_featured: validation.data.isFeatured,
      is_active: validation.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)

  if (updateError) {
    console.error("[updateProduct] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 7: Revalidate dashboard + storefront ISR cache
  revalidatePath(ROUTES.DASHBOARD_PRODUCTS)
  revalidateStorefront(store.slug)

  return { success: true }
}

/**
 * Delete a product
 * - Verifies ownership before deletion
 */
export async function deleteProduct(productId: string): Promise<ActionResult> {
  // Step 1: Verify authentication
  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: authError || ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  // Step 2: Get user's store
  const { store, error: storeError } = await getStoreForUser(user.id)
  if (!store) {
    return { success: false, error: storeError || ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  // Step 3: Verify ownership
  const isOwner = await verifyProductOwnership(productId, store.id)
  if (!isOwner) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 4: Delete product
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)

  if (deleteError) {
    console.error("[deleteProduct] Error:", deleteError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 5: Revalidate dashboard + storefront ISR cache
  revalidatePath(ROUTES.DASHBOARD_PRODUCTS)
  revalidateStorefront(store.slug)

  return { success: true }
}

/**
 * Toggle the featured status of a product
 */
export async function toggleProductFeatured(
  productId: string,
  isFeatured: boolean
): Promise<ActionResult> {
  // Step 1: Verify authentication
  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: authError || ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  // Step 2: Get user's store
  const { store, error: storeError } = await getStoreForUser(user.id)
  if (!store) {
    return { success: false, error: storeError || ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  // Step 3: Verify ownership
  const isOwner = await verifyProductOwnership(productId, store.id)
  if (!isOwner) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 4: Update product
  const { error: updateError } = await supabase
    .from("products")
    .update({
      is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)

  if (updateError) {
    console.error("[toggleProductFeatured] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 5: Revalidate dashboard + storefront ISR cache
  revalidatePath(ROUTES.DASHBOARD_PRODUCTS)
  revalidateStorefront(store.slug)

  return { success: true }
}

/**
 * Toggle the active status of a product
 */
export async function toggleProductActive(
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  // Step 1: Verify authentication
  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: authError || ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  // Step 2: Get user's store
  const { store, error: storeError } = await getStoreForUser(user.id)
  if (!store) {
    return { success: false, error: storeError || ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  // Step 3: Verify ownership
  const isOwner = await verifyProductOwnership(productId, store.id)
  if (!isOwner) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
  }

  const supabase = await createClient()

  // Step 4: Update product
  const { error: updateError } = await supabase
    .from("products")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)

  if (updateError) {
    console.error("[toggleProductActive] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  // Step 5: Revalidate dashboard + storefront ISR cache
  revalidatePath(ROUTES.DASHBOARD_PRODUCTS)
  revalidateStorefront(store.slug)

  return { success: true }
}
