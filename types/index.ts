// ============================================================
// STORE TYPES
// ============================================================

export type StoreStatus = "trial" | "active" | "paused" | "blocked"

export type Store = {
  id: string
  owner_id: string
  name: string
  slug: string
  tagline: string | null
  logo_url: string | null
  banner_url: string | null
  whatsapp_number: string
  theme_id: Theme
  status: StoreStatus
  trial_ends_at: string | null
  subscription_ends_at: string | null
  is_blocked: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string | null
}

// ============================================================
// CATEGORY TYPES
// ============================================================

export type Category = {
  id: string
  store_id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

// ============================================================
// PRODUCT TYPES
// ============================================================

export type Product = {
  id: string
  store_id: string
  category_id: string | null
  title: string
  slug: string
  price: number
  description: string | null
  images: string[]
  is_featured: boolean
  is_active: boolean
  admin_hidden: boolean
  created_at: string
  updated_at: string | null
}

export type ProductWithStore = Product & {
  store: Pick<Store, "id" | "name" | "slug">
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export type AnalyticsEventType = "view" | "click_whatsapp" | "product_view"

export type AnalyticsEvent = {
  id: string
  store_id: string
  product_id: string | null
  event_type: AnalyticsEventType
  metadata?: Record<string, unknown>
  created_at: string
}

// ============================================================
// USER / ADMIN TYPES
// ============================================================

export type UserRole = "seller" | "admin"

export type UserMetadata = {
  role?: UserRole
  store_id?: string
}

// ============================================================
// THEME TYPES
// ============================================================

export type Theme = "minimal" | "modern" | "luxury"

export type ThemeConfig = {
  id: Theme
  name: string
  description: string
  primaryColor: string
  accentColor: string
  bgColor: string
  textColor: string
  cardBg: string
  buttonRadius: string
}

export const THEMES: Record<Theme, ThemeConfig> = {
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple white design",
    primaryColor: "#25D366",
    accentColor: "#128C7E",
    bgColor: "#ffffff",
    textColor: "#1a1a1a",
    cardBg: "#f9fafb",
    buttonRadius: "rounded-lg",
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Bold with teal accents",
    primaryColor: "#14b8a6",
    accentColor: "#0d9488",
    bgColor: "#f0fdfa",
    textColor: "#134e4a",
    cardBg: "#ffffff",
    buttonRadius: "rounded-full",
  },
  luxury: {
    id: "luxury",
    name: "Luxury",
    description: "Dark and elegant with gold",
    primaryColor: "#d4af37",
    accentColor: "#b8960c",
    bgColor: "#1a1a1a",
    textColor: "#f5f5f5",
    cardBg: "#2d2d2d",
    buttonRadius: "rounded-none",
  },
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const endDate = new Date(trialEndsAt)
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getSubscriptionDaysRemaining(subscriptionEndsAt: string | null): number {
  if (!subscriptionEndsAt) return Infinity
  const endDate = new Date(subscriptionEndsAt)
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isTrialExpired(store: Store): boolean {
  if (store.status !== "trial") return false
  return getTrialDaysRemaining(store.trial_ends_at) <= 0
}

export function isSubscriptionExpired(store: Store): boolean {
  if (store.status !== "active") return false
  if (!store.subscription_ends_at) return false
  return getSubscriptionDaysRemaining(store.subscription_ends_at) <= 0
}

export function getExpiryDaysRemaining(store: Store): number | null {
  if (store.status === "trial") return getTrialDaysRemaining(store.trial_ends_at)
  if (store.status === "active" && store.subscription_ends_at) {
    return getSubscriptionDaysRemaining(store.subscription_ends_at)
  }
  return null
}

export function getStatusLabel(status: StoreStatus): string {
  const labels: Record<StoreStatus, string> = {
    trial: "Trial",
    active: "Active",
    paused: "Paused",
    blocked: "Blocked",
  }
  return labels[status]
}

export function getStatusColor(status: StoreStatus): string {
  const colors: Record<StoreStatus, string> = {
    trial: "bg-amber-100 text-amber-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-gray-100 text-gray-800",
    blocked: "bg-red-100 text-red-800",
  }
  return colors[status]
}
