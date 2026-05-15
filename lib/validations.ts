import { z } from "zod"
import {
  VALIDATION_PATTERNS,
  PRODUCT_LIMITS,
  STORE_LIMITS,
  CATEGORY_LIMITS,
  THEME_IDS,
} from "@/lib/constants"

// ============================================================
// AUTH SCHEMAS
// ============================================================

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Sign up form validation schema
 */
export const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        VALIDATION_PATTERNS.STRONG_PASSWORD,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    storeName: z
      .string()
      .min(1, "Store name is required")
      .min(3, "Store name must be at least 3 characters")
      .max(
        STORE_LIMITS.MAX_NAME_LENGTH,
        `Store name must be less than ${STORE_LIMITS.MAX_NAME_LENGTH} characters`
      )
      .regex(
        VALIDATION_PATTERNS.STORE_NAME,
        "Store name can only contain letters, numbers, spaces, and basic punctuation"
      ),
    whatsappNumber: z
      .string()
      .min(1, "WhatsApp number is required")
      .regex(
        VALIDATION_PATTERNS.PHONE_E164,
        "Please enter a valid WhatsApp number in international format (e.g., +919876543210)"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignUpInput = z.infer<typeof signUpSchema>

// ============================================================
// STORE SCHEMAS
// ============================================================

/**
 * Store onboarding form validation schema
 */
export const storeOnboardingSchema = z.object({
  name: z
    .string()
    .min(1, "Store name is required")
    .min(3, "Store name must be at least 3 characters")
    .max(
      STORE_LIMITS.MAX_NAME_LENGTH,
      `Store name must be less than ${STORE_LIMITS.MAX_NAME_LENGTH} characters`
    )
    .regex(
      VALIDATION_PATTERNS.STORE_NAME,
      "Store name can only contain letters, numbers, spaces, and basic punctuation"
    ),
  whatsappNumber: z
    .string()
    .min(1, "WhatsApp number is required")
    .regex(
      VALIDATION_PATTERNS.PHONE_E164,
      "Please enter a valid WhatsApp number in international format (e.g., +919876543210)"
    ),
})

export type StoreOnboardingInput = z.infer<typeof storeOnboardingSchema>

/**
 * Store settings form validation schema
 */
export const storeSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Store name is required")
    .min(3, "Store name must be at least 3 characters")
    .max(
      STORE_LIMITS.MAX_NAME_LENGTH,
      `Store name must be less than ${STORE_LIMITS.MAX_NAME_LENGTH} characters`
    )
    .regex(
      VALIDATION_PATTERNS.STORE_NAME,
      "Store name can only contain letters, numbers, spaces, and basic punctuation"
    ),
  whatsappNumber: z
    .string()
    .min(1, "WhatsApp number is required")
    .regex(
      VALIDATION_PATTERNS.PHONE_E164,
      "Please enter a valid WhatsApp number in international format (e.g., +919876543210)"
    ),
  tagline: z
    .string()
    .max(
      STORE_LIMITS.MAX_TAGLINE_LENGTH,
      `Tagline must be less than ${STORE_LIMITS.MAX_TAGLINE_LENGTH} characters`
    )
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .url("Please enter a valid URL")
    .regex(VALIDATION_PATTERNS.HTTPS_URL, "URL must use HTTPS")
    .optional()
    .or(z.literal("")),
  bannerUrl: z
    .string()
    .url("Please enter a valid URL")
    .regex(VALIDATION_PATTERNS.HTTPS_URL, "URL must use HTTPS")
    .optional()
    .or(z.literal("")),
  themeId: z.enum(THEME_IDS).default("minimal"),
})

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>

// ============================================================
// PRODUCT SCHEMAS
// ============================================================

/**
 * HTTPS URL validation for images
 */
const httpsUrlSchema = z
  .string()
  .url("Please enter a valid URL")
  .regex(VALIDATION_PATTERNS.HTTPS_URL, "Image URL must use HTTPS")

/**
 * Product form validation schema
 */
export const productSchema = z.object({
  title: z
    .string()
    .min(1, "Product title is required")
    .min(2, "Product title must be at least 2 characters")
    .max(
      PRODUCT_LIMITS.MAX_TITLE_LENGTH,
      `Product title must be less than ${PRODUCT_LIMITS.MAX_TITLE_LENGTH} characters`
    )
    .regex(
      VALIDATION_PATTERNS.SAFE_TEXT,
      "Product title cannot contain special characters like <, >, {, }, [, ], \\"
    ),
  description: z
    .string()
    .max(
      PRODUCT_LIMITS.MAX_DESCRIPTION_LENGTH,
      `Description must be less than ${PRODUCT_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
    )
    .regex(
      VALIDATION_PATTERNS.SAFE_TEXT,
      "Description cannot contain special characters like <, >, {, }, [, ], \\"
    )
    .optional()
    .or(z.literal("")),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(
      PRODUCT_LIMITS.MAX_PRICE,
      `Price cannot exceed ${PRODUCT_LIMITS.MAX_PRICE.toLocaleString()}`
    ),
  images: z
    .array(httpsUrlSchema)
    .max(
      PRODUCT_LIMITS.MAX_IMAGES_PER_PRODUCT,
      `Maximum ${PRODUCT_LIMITS.MAX_IMAGES_PER_PRODUCT} images allowed`
    )
    .optional()
    .default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  categoryId: z.string().uuid("Invalid category").nullable().optional(),
})

export type ProductInput = z.infer<typeof productSchema>

// ============================================================
// CATEGORY SCHEMAS
// ============================================================

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(
      CATEGORY_LIMITS.MAX_NAME_LENGTH,
      `Category name must be less than ${CATEGORY_LIMITS.MAX_NAME_LENGTH} characters`
    )
    .regex(
      VALIDATION_PATTERNS.SAFE_TEXT,
      "Category name cannot contain special characters"
    ),
})

export type CategoryInput = z.infer<typeof categorySchema>

// ============================================================
// ADMIN SCHEMAS
// ============================================================

/**
 * Extend trial form validation schema
 */
export const extendTrialSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
  days: z
    .number()
    .int("Days must be a whole number")
    .positive("Days must be greater than 0")
    .max(365, "Cannot extend more than 365 days at once"),
})

export type ExtendTrialInput = z.infer<typeof extendTrialSchema>

export const storeActionSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
})

export type StoreActionInput = z.infer<typeof storeActionSchema>

export const convertToRegularSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
  endsAt: z
    .string()
    .min(1, "Select an end date")
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
})

export type ConvertToRegularInput = z.infer<typeof convertToRegularSchema>

export const productAdminActionSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
})

export type ProductAdminActionInput = z.infer<typeof productAdminActionSchema>

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Trims whitespace before DB writes. XSS protection is handled by React's auto-escaping at render time.
export function sanitizeString(input: string): string {
  return input.trim()
}

/**
 * Generate a URL-safe slug from a name
 * Converts to lowercase, removes special chars, replaces spaces with dashes
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, STORE_LIMITS.MAX_SLUG_LENGTH)
}

/**
 * Validate a UUID string
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Format a phone number for display
 * Input: +919876543210 -> Output: +91 98765 43210
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length <= 10) return phone

  const countryCode = phone.slice(0, phone.length - 10)
  const rest = phone.slice(-10)
  return `${countryCode} ${rest.slice(0, 5)} ${rest.slice(5)}`
}
