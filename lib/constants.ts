// ============================================================
// APPLICATION CONSTANTS
// ============================================================

/**
 * Trial configuration
 */
export const TRIAL_CONFIG = {
  /** Number of days for free trial */
  TRIAL_DAYS: 7,
  /** Number of days before trial end to show warning */
  WARNING_DAYS: 3,
} as const

/**
 * Cloudinary upload limits (enforced client-side and via signed upload params)
 */
export const CLOUDINARY_UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 5,
  /** Formats sent to Cloudinary API — must stay in sync with ALLOWED_MIME_TYPES */
  ALLOWED_FORMATS: "jpg,jpeg,png,webp,gif",
  /** MIME types for the <input accept> attribute */
  ALLOWED_MIME_TYPES: "image/jpeg,image/png,image/webp,image/gif",
} as const

/**
 * Category limits
 */
export const CATEGORY_LIMITS = {
  MAX_CATEGORIES_PER_STORE: 20,
  MAX_NAME_LENGTH: 60,
} as const

/**
 * Product limits
 */
export const PRODUCT_LIMITS = {
  /** Maximum products per store (free/trial) */
  MAX_PRODUCTS_FREE: 50,
  /** Maximum products per store (paid) */
  MAX_PRODUCTS_PAID: 500,
  /** Maximum images per product */
  MAX_IMAGES_PER_PRODUCT: 10,
  /** Maximum title length */
  MAX_TITLE_LENGTH: 200,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 2000,
  /** Maximum price value */
  MAX_PRICE: 9999999,
} as const

/**
 * Store limits
 */
export const STORE_LIMITS = {
  /** Maximum store name length */
  MAX_NAME_LENGTH: 60,
  /** Maximum tagline length */
  MAX_TAGLINE_LENGTH: 150,
  /** Maximum slug length */
  MAX_SLUG_LENGTH: 50,
} as const

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
  /** E.164 phone number format (e.g., +919876543210) */
  PHONE_E164: /^\+[1-9]\d{6,14}$/,
  /** URL-safe slug format */
  SLUG: /^[a-z0-9-]+$/,
  /** HTTPS URL */
  HTTPS_URL: /^https:\/\//,
  /** Safe text (no XSS characters) */
  SAFE_TEXT: /^[^<>{}[\]\\]*$/,
  /** Store name allowed characters */
  STORE_NAME: /^[a-zA-Z0-9\s\-_&'.]+$/,
  /** Strong password (min 8 chars, uppercase, lowercase, number) */
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
} as const

/**
 * Theme IDs
 */
export const THEME_IDS = ["minimal", "modern", "luxury"] as const
export type ThemeId = (typeof THEME_IDS)[number]

/**
 * Store status values
 */
export const STORE_STATUSES = ["trial", "active", "paused", "blocked"] as const

/**
 * Analytics event types
 */
export const ANALYTICS_EVENT_TYPES = [
  "view",
  "click_whatsapp",
  "product_view",
] as const
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]

/**
 * User roles
 */
export const USER_ROLES = ["seller", "admin"] as const
export type UserRole = (typeof USER_ROLES)[number]

/**
 * Route paths
 */
export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/auth/login",
  SIGN_UP: "/auth/sign-up",
  AUTH_CALLBACK: "/auth/callback",
  AUTH_ERROR: "/auth/error",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",

  // Seller dashboard
  DASHBOARD: "/dashboard",
  DASHBOARD_PRODUCTS: "/dashboard/products",
  DASHBOARD_PRODUCTS_NEW: "/dashboard/products/new",
  DASHBOARD_CATEGORIES: "/dashboard/categories",
  DASHBOARD_ANALYTICS: "/dashboard/analytics",
  DASHBOARD_SETTINGS: "/dashboard/settings",

  // Admin
  ADMIN: "/admin",
  ADMIN_STORES: "/admin/stores",
  ADMIN_PRODUCTS: "/admin/products",

  // Storefront (dynamic)
  storefront: (slug: string) => `/s/${slug}`,
  storefrontProducts: (slug: string) => `/s/${slug}/products`,
  storefrontProduct: (storeSlug: string, productSlug: string) =>
    `/s/${storeSlug}/${productSlug}`,

  // Dashboard (dynamic)
  dashboardProductEdit: (id: string) => `/dashboard/products/${id}/edit`,

  // Admin (dynamic)
  adminStoreDetail: (id: string) => `/admin/stores/${id}`,
} as const

/**
 * API error messages
 */
export const ERROR_MESSAGES = {
  // Auth
  NOT_AUTHENTICATED: "You must be logged in to perform this action",
  UNAUTHORIZED: "You are not authorized to perform this action",
  INVALID_CREDENTIALS: "Invalid email or password",

  // Store
  STORE_NOT_FOUND: "Store not found",
  STORE_ALREADY_EXISTS: "You already have a store",
  STORE_BLOCKED: "Your store has been blocked. Please contact support.",
  STORE_UNAVAILABLE: "This store is currently unavailable",

  // Product
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_LIMIT_REACHED: "You have reached the maximum number of products",

  // Category
  CATEGORY_NOT_FOUND: "Category not found",
  CATEGORY_LIMIT_REACHED: "You have reached the maximum number of categories (20)",

  // Generic
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  VALIDATION_ERROR: "Please check your input and try again",
} as const

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  STORE_CREATED: "Store created successfully!",
  STORE_UPDATED: "Store settings saved",
  PRODUCT_CREATED: "Product added successfully",
  PRODUCT_UPDATED: "Product updated",
  PRODUCT_DELETED: "Product deleted",
  CATEGORY_CREATED: "Category created",
  CATEGORY_UPDATED: "Category updated",
  CATEGORY_DELETED: "Category deleted",
} as const
