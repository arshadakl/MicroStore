"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { categorySchema, generateSlug, sanitizeString } from "@/lib/validations"
import { ERROR_MESSAGES, SUCCESS_MESSAGES, ROUTES, CATEGORY_LIMITS } from "@/lib/constants"

export type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

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

export async function createCategory(
  name: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  const validation = categorySchema.safeParse({ name })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || ERROR_MESSAGES.VALIDATION_ERROR,
    }
  }

  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: authError || ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  const { store, error: storeError } = await getStoreForUser(user.id)
  if (!store) {
    return { success: false, error: storeError || ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  const supabase = await createClient()

  // Check category limit
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)

  if ((count ?? 0) >= CATEGORY_LIMITS.MAX_CATEGORIES_PER_STORE) {
    return { success: false, error: ERROR_MESSAGES.CATEGORY_LIMIT_REACHED }
  }

  // Generate unique slug within the store
  let slug = generateSlug(validation.data.name)
  let suffix = 0
  let isUnique = false

  while (!isUnique) {
    const checkSlug = suffix > 0 ? `${slug}-${suffix}` : slug
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("store_id", store.id)
      .eq("slug", checkSlug)
      .single()

    if (!existing) {
      slug = checkSlug
      isUnique = true
    } else {
      suffix++
    }
  }

  const { data: category, error: createError } = await supabase
    .from("categories")
    .insert({
      store_id: store.id,
      name: sanitizeString(validation.data.name),
      slug,
    })
    .select("id, slug")
    .single()

  if (createError || !category) {
    console.error("[createCategory] Error:", createError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.DASHBOARD_CATEGORIES)
  revalidatePath(ROUTES.DASHBOARD_PRODUCTS)
  revalidateStorefront(store.slug)

  return { success: true, data: { id: category.id, slug: category.slug } }
}

export async function updateCategory(
  categoryId: string,
  name: string
): Promise<ActionResult> {
  const validation = categorySchema.safeParse({ name })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || ERROR_MESSAGES.VALIDATION_ERROR,
    }
  }

  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: authError || ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  const { store, error: storeError } = await getStoreForUser(user.id)
  if (!store) {
    return { success: false, error: storeError || ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from("categories")
    .select("id, store_id")
    .eq("id", categoryId)
    .single()

  if (!existing || existing.store_id !== store.id) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
  }

  const { error: updateError } = await supabase
    .from("categories")
    .update({ name: sanitizeString(validation.data.name) })
    .eq("id", categoryId)

  if (updateError) {
    console.error("[updateCategory] Error:", updateError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.DASHBOARD_CATEGORIES)
  revalidatePath(ROUTES.DASHBOARD_PRODUCTS)
  revalidateStorefront(store.slug)

  return { success: true }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: authError || ERROR_MESSAGES.NOT_AUTHENTICATED }
  }

  const { store, error: storeError } = await getStoreForUser(user.id)
  if (!store) {
    return { success: false, error: storeError || ERROR_MESSAGES.STORE_NOT_FOUND }
  }

  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from("categories")
    .select("id, store_id")
    .eq("id", categoryId)
    .single()

  if (!existing || existing.store_id !== store.id) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
  }

  const { error: deleteError } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)

  if (deleteError) {
    console.error("[deleteCategory] Error:", deleteError)
    return { success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }
  }

  revalidatePath(ROUTES.DASHBOARD_CATEGORIES)
  revalidatePath(ROUTES.DASHBOARD_PRODUCTS)
  revalidateStorefront(store.slug)

  return { success: true }
}
