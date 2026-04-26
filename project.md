# MicroStore — Project Reference

> **Purpose of this file:** This is the single source of truth for any agent, developer, or AI working on this codebase. Read this before making any change, fixing any bug, or adding any feature. Every section maps directly to code that exists in this repository.

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Routing Map](#4-routing-map)
5. [Database Schema](#5-database-schema)
6. [Types System](#6-types-system)
7. [Constants & Configuration](#7-constants--configuration)
8. [Validation Layer (Zod)](#8-validation-layer-zod)
9. [Server Actions](#9-server-actions)
10. [Query Layer](#10-query-layer)
11. [Authentication & Middleware](#11-authentication--middleware)
12. [Feature: Landing Page](#12-feature-landing-page)
13. [Feature: Auth Pages](#13-feature-auth-pages)
14. [Feature: Seller Dashboard](#14-feature-seller-dashboard)
15. [Feature: Public Storefront](#15-feature-public-storefront)
16. [Feature: Super Admin Panel](#16-feature-super-admin-panel)
17. [Store Status Lifecycle](#17-store-status-lifecycle)
18. [Trial & Subscription System](#18-trial--subscription-system)
19. [Theming System](#19-theming-system)
20. [WhatsApp Integration](#20-whatsapp-integration)
21. [Security Architecture](#21-security-architecture)
22. [Component Index](#22-component-index)
23. [Environment Variables](#23-environment-variables)
24. [Known Issues & Pending Work](#24-known-issues--pending-work)
25. [How to Add New Features](#25-how-to-add-new-features)
26. [How to Fix Bugs](#26-how-to-fix-bugs)

---

## 1. What This Project Is

**MicroStore** is a WhatsApp-first micro store platform built for Indian Instagram sellers. Sellers create a free store, list products, and share product links on Instagram. Customers then place orders directly on WhatsApp — no cart, no checkout, no payment gateway involved.

### Core User Flow

```
Seller signs up
  → Creates store (name + WhatsApp number)
  → Adds products (title, price, images, description)
  → Shares store link / product links on Instagram
    → Customer visits public storefront (/s/store-slug)
    → Customer clicks "Order on WhatsApp"
    → WhatsApp opens with a pre-filled order message
    → Seller receives and handles the order manually
```

### Business Model

- Sellers start on a **7-day trial** (set in `TRIAL_CONFIG.TRIAL_DAYS` in `lib/constants.ts`)
- After trial, admin manually activates or pauses the store
- **No automated billing or payment gateway is implemented** — activation is done manually by the admin from the admin panel
- Admin can: **block**, **pause**, **activate**, or **extend trial** for any store

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Validation | Zod |
| Forms | react-hook-form + @hookform/resolvers/zod |
| Icons | lucide-react |
| Font | Geist (sans) + Geist Mono |
| Deployment | Vercel |

---

## 3. Directory Structure

```
/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── layout.tsx                        # Root layout (metadata, fonts)
│   ├── globals.css                       # Tailwind v4 config + theme CSS variables
│   │
│   ├── auth/
│   │   ├── login/page.tsx                # Login form
│   │   ├── sign-up/page.tsx              # Sign up form
│   │   ├── callback/route.ts             # Supabase OAuth/email callback handler
│   │   └── error/page.tsx                # Auth error page
│   │
│   ├── dashboard/                        # Seller dashboard (protected)
│   │   ├── layout.tsx                    # Auth check, sidebar, TrialBanner, BlockedScreen
│   │   ├── page.tsx                      # Overview: stats, store link, empty state
│   │   ├── settings/page.tsx             # Store settings form
│   │   └── products/
│   │       ├── page.tsx                  # Product list table
│   │       ├── new/page.tsx              # Add product form
│   │       └── [id]/edit/page.tsx        # Edit product form
│   │
│   ├── admin/                            # Super admin panel (admin role only)
│   │   ├── layout.tsx                    # Admin auth check + sidebar
│   │   ├── page.tsx                      # Overview: stats cards + alerts
│   │   ├── products/page.tsx             # All products across all stores
│   │   └── stores/
│   │       ├── page.tsx                  # All stores table + actions
│   │       └── [storeId]/page.tsx        # Store detail + products table
│   │
│   └── s/[storeSlug]/                    # Public storefront (no auth)
│       ├── layout.tsx                    # Theme application + blocked check
│       ├── page.tsx                      # Store homepage (featured products)
│       ├── products/page.tsx             # All products grid
│       └── [productSlug]/page.tsx        # Product detail + WhatsApp button
│
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx              # Admin navigation sidebar
│   │   ├── AdminStoreActions.tsx         # Dropdown: block/pause/activate/extend/delete
│   │   └── StoreStatusBadge.tsx          # Colored badge for store status
│   │
│   ├── dashboard/
│   │   ├── DashboardSidebar.tsx          # Seller navigation + store status pill
│   │   ├── BlockedStoreScreen.tsx        # Full-screen blocked/paused state
│   │   ├── CopyButton.tsx                # Client-side clipboard copy button
│   │   ├── ProductForm.tsx               # Add/edit product (react-hook-form + Zod)
│   │   ├── ProductListTable.tsx          # Products table with delete/edit/copy/toggle
│   │   ├── StoreOnboarding.tsx           # First-time store setup form
│   │   ├── StoreSettingsForm.tsx         # Store settings (react-hook-form + Zod)
│   │   └── TrialBanner.tsx               # Top banner showing trial days remaining
│   │
│   └── store/
│       ├── ProductCard.tsx               # Product card for storefront grid
│       ├── StoreNavbar.tsx               # Public storefront top nav
│       ├── StoreUnavailable.tsx          # Shown when store is blocked/paused
│       └── WhatsAppButton.tsx            # "Order on WhatsApp" button
│
├── lib/
│   ├── constants.ts                      # All app-wide constants (routes, limits, patterns)
│   ├── queries.ts                        # Read-only Supabase queries + utility functions
│   ├── validations.ts                    # All Zod schemas + sanitization utilities
│   ├── actions/
│   │   ├── store.ts                      # Server actions: createStore, updateStore, etc.
│   │   ├── product.ts                    # Server actions: createProduct, deleteProduct, etc.
│   │   └── admin.ts                      # Server actions: blockStore, extendTrial, etc.
│   └── supabase/
│       ├── client.ts                     # Browser Supabase client (singleton)
│       ├── server.ts                     # Server Supabase client (cookies)
│       └── middleware.ts                 # Session refresh + route protection logic
│
├── types/
│   └── index.ts                          # All TypeScript types, enums, and helper functions
│
├── middleware.ts                         # Next.js middleware entry (delegates to lib/supabase/middleware.ts)
├── supabase.md                           # Full Supabase setup guide (run this before deploying)
└── project.md                            # This file
```

---

## 4. Routing Map

| URL Pattern | File | Access | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Public | Landing page |
| `/auth/login` | `app/auth/login/page.tsx` | Public | Login |
| `/auth/sign-up` | `app/auth/sign-up/page.tsx` | Public | Sign up |
| `/auth/callback` | `app/auth/callback/route.ts` | Public | Supabase auth callback |
| `/auth/error` | `app/auth/error/page.tsx` | Public | Auth error page |
| `/dashboard` | `app/dashboard/page.tsx` | Seller only | Store overview |
| `/dashboard/products` | `app/dashboard/products/page.tsx` | Seller only | Product list |
| `/dashboard/products/new` | `app/dashboard/products/new/page.tsx` | Seller only | Add product |
| `/dashboard/products/[id]/edit` | `app/dashboard/products/[id]/edit/page.tsx` | Seller only | Edit product |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Seller only | Store settings |
| `/admin` | `app/admin/page.tsx` | Admin only | Admin overview |
| `/admin/stores` | `app/admin/stores/page.tsx` | Admin only | All stores |
| `/admin/stores/[storeId]` | `app/admin/stores/[storeId]/page.tsx` | Admin only | Store detail |
| `/admin/products` | `app/admin/products/page.tsx` | Admin only | All products |
| `/s/[storeSlug]` | `app/s/[storeSlug]/page.tsx` | Public | Storefront home |
| `/s/[storeSlug]/products` | `app/s/[storeSlug]/products/page.tsx` | Public | All products |
| `/s/[storeSlug]/[productSlug]` | `app/s/[storeSlug]/[productSlug]/page.tsx` | Public | Product detail |

### Route helpers

All route strings are centralized in `lib/constants.ts` under the `ROUTES` object. **Never hardcode route strings in pages or components** — always import from `ROUTES`.

```ts
import { ROUTES } from "@/lib/constants"

ROUTES.LOGIN                                       // "/auth/login"
ROUTES.DASHBOARD_PRODUCTS_NEW                      // "/dashboard/products/new"
ROUTES.storefront("my-shop")                       // "/s/my-shop"
ROUTES.storefrontProduct("my-shop", "red-dress")   // "/s/my-shop/red-dress"
ROUTES.dashboardProductEdit("uuid-here")           // "/dashboard/products/uuid-here/edit"
ROUTES.adminStoreDetail("uuid-here")               // "/admin/stores/uuid-here"
```

---

## 5. Database Schema

> Full SQL is in `supabase.md`. Run it in Supabase SQL Editor before deploying.

### Table: `stores`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `owner_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE |
| `name` | `text` | Store display name (max 60 chars) |
| `slug` | `text` | Unique URL slug (e.g. `my-shop`) |
| `tagline` | `text` | Optional store tagline (max 150 chars) |
| `logo_url` | `text` | HTTPS URL to logo image (optional) |
| `banner_url` | `text` | HTTPS URL to banner image (optional) |
| `whatsapp_number` | `text` | E.164 format (e.g. `+919876543210`) |
| `theme_id` | `text` | `"minimal"` \| `"modern"` \| `"luxury"` |
| `status` | `text` | `"trial"` \| `"active"` \| `"paused"` \| `"blocked"` |
| `trial_ends_at` | `timestamptz` | Set to NOW + 7 days on store creation |
| `is_blocked` | `boolean` | Redundant flag for fast middleware checks |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Updated manually on every write |

### Table: `products`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `store_id` | `uuid` | FK → `stores(id)` ON DELETE CASCADE |
| `title` | `text` | Product title (max 200 chars) |
| `slug` | `text` | URL-safe slug, unique per store |
| `price` | `numeric` | Price in Indian Rupees |
| `description` | `text` | Optional (max 2000 chars) |
| `images` | `text[]` | Array of HTTPS image URLs (max 10) |
| `is_featured` | `boolean` | Shown in featured section on store home |
| `is_active` | `boolean` | If false, hidden from public storefront |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Updated manually on every write |

### Table: `analytics_events`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `store_id` | `uuid` | FK → `stores(id)` ON DELETE CASCADE |
| `product_id` | `uuid` | FK → `products(id)`, nullable |
| `event_type` | `text` | `"view"` \| `"click_whatsapp"` \| `"product_view"` |
| `created_at` | `timestamptz` | Auto |

### RLS Policies Summary

- `stores`: Sellers can read/write only their own row (`owner_id = auth.uid()`)
- `products`: Sellers can read/write only products in their own store
- `analytics_events`: Anyone can insert (for tracking); sellers can read only their store's events
- Admin reads all tables using a Supabase service role (via admin server actions)

---

## 6. Types System

**File:** `types/index.ts`

All shared TypeScript types live here. Import from `@/types`.

### Key Types

```ts
type StoreStatus = "trial" | "active" | "paused" | "blocked"
type Theme = "minimal" | "modern" | "luxury"
type AnalyticsEventType = "view" | "click_whatsapp" | "product_view"
type UserRole = "seller" | "admin"

type Store = { id, owner_id, name, slug, tagline, logo_url, banner_url,
               whatsapp_number, theme_id, status, trial_ends_at, is_blocked,
               created_at, updated_at }

type Product = { id, store_id, title, slug, price, description, images[],
                 is_featured, is_active, created_at, updated_at }

type ProductWithStore = Product & { store: Pick<Store, "id" | "name" | "slug"> }
type AnalyticsEvent = { id, store_id, product_id, event_type, created_at }
```

### Helper Functions (exported from `types/index.ts`)

| Function | Description |
|---|---|
| `getTrialDaysRemaining(trialEndsAt)` | Returns days remaining as integer (min 0) |
| `isTrialExpired(store)` | Returns true if status is "trial" and days <= 0 |
| `getStatusLabel(status)` | Returns display string: "Trial", "Active", etc. |
| `getStatusColor(status)` | Returns Tailwind classes for badge background + text |
| `THEMES` | Record of all 3 theme configs with colors and button radius |

---

## 7. Constants & Configuration

**File:** `lib/constants.ts`

Centralized configuration. Never hardcode values that appear here.

```ts
TRIAL_CONFIG.TRIAL_DAYS          // 7 — days for new store trial
TRIAL_CONFIG.WARNING_DAYS        // 3 — days before expiry to show warning banner

PRODUCT_LIMITS.MAX_PRODUCTS_FREE // 50
PRODUCT_LIMITS.MAX_PRODUCTS_PAID // 500
PRODUCT_LIMITS.MAX_IMAGES_PER_PRODUCT  // 10
PRODUCT_LIMITS.MAX_TITLE_LENGTH  // 200
PRODUCT_LIMITS.MAX_DESCRIPTION_LENGTH  // 2000
PRODUCT_LIMITS.MAX_PRICE         // 9_999_999

STORE_LIMITS.MAX_NAME_LENGTH     // 60
STORE_LIMITS.MAX_TAGLINE_LENGTH  // 150
STORE_LIMITS.MAX_SLUG_LENGTH     // 50

VALIDATION_PATTERNS.PHONE_E164   // /^\+[1-9]\d{6,14}$/
VALIDATION_PATTERNS.SLUG         // /^[a-z0-9-]+$/
VALIDATION_PATTERNS.HTTPS_URL    // /^https:\/\//
VALIDATION_PATTERNS.SAFE_TEXT    // Blocks XSS characters
VALIDATION_PATTERNS.STRONG_PASSWORD  // Requires upper + lower + number

ERROR_MESSAGES.*                 // All user-facing error strings
SUCCESS_MESSAGES.*               // All user-facing success strings
ROUTES.*                         // All route paths (see Section 4)
```

---

## 8. Validation Layer (Zod)

**File:** `lib/validations.ts`

All forms are validated with Zod on both client (react-hook-form) and server (in server actions).

### Schemas

| Schema | Used In | Fields |
|---|---|---|
| `loginSchema` | Login page | `email`, `password` |
| `signUpSchema` | Sign up page | `email`, `password`, `confirmPassword`, `storeName`, `whatsappNumber` |
| `storeOnboardingSchema` | StoreOnboarding component | `name`, `whatsappNumber` |
| `storeSettingsSchema` | StoreSettingsForm component | `name`, `whatsappNumber`, `tagline`, `logoUrl`, `bannerUrl`, `themeId` |
| `productSchema` | ProductForm component | `title`, `description`, `price`, `images[]`, `isFeatured`, `isActive` |
| `extendTrialSchema` | Admin actions | `storeId`, `days` |
| `storeActionSchema` | Admin actions | `storeId` |

### Utility Functions (exported from `lib/validations.ts`)

| Function | Description |
|---|---|
| `sanitizeString(input)` | Escapes HTML special characters to prevent XSS |
| `generateSlug(name)` | Converts store/product name to URL-safe slug |
| `isValidUUID(str)` | Validates UUID format |
| `formatPhoneNumber(phone)` | Formats E.164 phone for display |

### Usage Pattern

```ts
// In a client component form:
const form = useForm<ProductInput>({
  resolver: zodResolver(productSchema),
  defaultValues: { ... }
})

// In a server action (always validate again on server):
const validation = productSchema.safeParse(input)
if (!validation.success) {
  return { success: false, error: validation.error.errors[0]?.message }
}
```

---

## 9. Server Actions

All mutations go through server actions — never write directly to Supabase from a client component.

### `lib/actions/store.ts`

| Function | Description | Auth Required |
|---|---|---|
| `createStore(input)` | Creates store, generates slug, sets trial. One store per user max. | Yes |
| `updateStore(storeId, input)` | Updates store settings. Verifies ownership. | Yes |
| `getMyStore()` | Returns the calling user's store or null | Yes |
| `checkStoreAccess(storeId)` | Returns `{canAccess, reason}` for public storefront checks | No |

### `lib/actions/product.ts`

| Function | Description | Auth Required |
|---|---|---|
| `createProduct(input)` | Creates product. Checks store not blocked. Generates slug. | Yes |
| `updateProduct(productId, input)` | Updates product. Verifies ownership chain (user → store → product). | Yes |
| `deleteProduct(productId)` | Deletes product. Verifies ownership. | Yes |
| `toggleProductFeatured(productId, isFeatured)` | Toggles featured flag. Verifies ownership. | Yes |
| `toggleProductActive(productId, isActive)` | Toggles active/inactive. Verifies ownership. | Yes |

### `lib/actions/admin.ts`

All admin actions first call `verifyAdmin()` which checks `user.user_metadata.role === "admin"`.

| Function | Description |
|---|---|
| `blockStore(storeId)` | Sets `status = "blocked"`, `is_blocked = true` |
| `pauseStore(storeId)` | Sets `status = "paused"` |
| `activateStore(storeId)` | Sets `status = "active"`, `is_blocked = false` |
| `extendTrial(storeId, days)` | Adds days to `trial_ends_at`, resets to `status = "trial"` |
| `deleteStore(storeId)` | Deletes products, analytics, then the store |
| `getAdminStats()` | Returns `AdminStats` object with counts per status |
| `getAllStores()` | Returns all stores with product count joined |
| `getStoreWithProducts(storeId)` | Returns one store + all its products |
| `getAllProducts()` | Returns all products across all stores with store info |

### Action Result Type

Every action returns `ActionResult<T>`:

```ts
type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}
```

Always check `result.success` before using `result.data`.

---

## 10. Query Layer

**File:** `lib/queries.ts`

Read-only queries used in Server Components (pages). Do not call these from client components.

### Store Queries

| Function | Used In |
|---|---|
| `getStoreBySlug(slug)` | Public storefront layout |
| `getStoreByOwnerId(ownerId)` | Dashboard (alternative to direct supabase call) |

### Product Queries

| Function | Used In |
|---|---|
| `getProductsByStoreId(storeId)` | Dashboard product list (includes inactive) |
| `getActiveProductsByStoreId(storeId)` | Public storefront (active only) |
| `getFeaturedProducts(storeId, limit?)` | Store homepage featured section |
| `getProductBySlug(storeId, slug)` | Product detail page |
| `getProductById(id)` | Edit product page |
| `countProductsByStoreId(storeId)` | Dashboard stats |

### Analytics

| Function | Description |
|---|---|
| `trackEvent(storeId, eventType, productId?)` | Inserts an analytics event |
| `getAnalyticsSummary(storeId)` | Returns `{totalViews, totalClicks, productViews}` |

> **Note:** Analytics tracking is defined but not yet called from storefront pages. See [Section 24](#24-known-issues--pending-work).

### Utility Functions

| Function | Description |
|---|---|
| `buildWhatsAppUrl(phone, product, productUrl)` | Generates wa.me URL with pre-filled order message |
| `buildStoreWhatsAppUrl(phone, storeName)` | Generates wa.me URL for general store inquiry |
| `formatPrice(price)` | Returns `"₹1,23,456"` (Indian number format) |
| `slugify(text)` | URL-safe slug generator |

---

## 11. Authentication & Middleware

### How Auth Works

1. **Supabase Auth** handles email/password authentication
2. After login, a session cookie is set
3. The Supabase client in `lib/supabase/server.ts` reads session from cookies on every server request
4. User role is stored in `user.user_metadata.role` — set to `"admin"` for admins

### Middleware (`middleware.ts` → `lib/supabase/middleware.ts`)

The middleware runs on every request (except static assets).

**Rules applied in order:**
1. If user is not authenticated:
   - `/dashboard/*` → redirect to `/auth/login`
   - `/admin/*` → redirect to `/auth/login`
2. If user is authenticated and on an auth route (`/auth/*`):
   - Redirect to `/admin` if admin
   - Redirect to `/dashboard` if seller
3. If user is on `/admin/*` but is not admin → redirect to `/dashboard`
4. If user is on `/dashboard/*` and their store is blocked → add `x-store-blocked` header (dashboard layout handles the UI)

### Dashboard Layout Auth (`app/dashboard/layout.tsx`)

The dashboard layout performs an additional server-side check:
- Redirects to `/auth/login` if no user
- Redirects to `/admin` if the user is an admin (admins don't use the seller dashboard)
- Shows `<BlockedStoreScreen>` if `store.is_blocked || store.status === "blocked" || store.status === "paused"`
- Shows `<TrialBanner>` at the top when `store.status === "trial"`

### Making a User an Admin

Set `role: "admin"` in Supabase Auth → user metadata. See `supabase.md` for the SQL command.

---

## 12. Feature: Landing Page

**File:** `app/page.tsx`

**Sections (in order):**
1. Sticky navbar with logo, "Sign in" and "Get started free" buttons
2. Hero with tagline, subtitle, and two CTAs
3. "How it works" — 3-step cards (Create store → Add products → Share & sell)
4. "Everything you need" — 8-feature checklist grid
5. Bottom CTA section
6. Footer

**What is implemented:**
- All UI sections rendered correctly
- Links use `ROUTES` constants
- No "free", "no credit card" or pricing copy (removed per requirement)

**What is NOT on this page:**
- No pricing page (business model is manual, handled by admin)
- No demo storefront link

---

## 13. Feature: Auth Pages

### Login (`app/auth/login/page.tsx`)

- react-hook-form + `loginSchema` (Zod)
- Fields: email, password
- Calls `supabase.auth.signInWithPassword()`
- On success: redirects to `/dashboard` (middleware also handles redirect)
- Shows field-level errors inline

### Sign Up (`app/auth/sign-up/page.tsx`)

- react-hook-form + `signUpSchema` (Zod)
- Fields: email, password, confirm password, store name, WhatsApp number (E.164 format)
- On success: redirects to sign-up success page or shows email confirmation notice
- Password rules: min 8 chars, uppercase, lowercase, number
- Collects `storeName` and `whatsappNumber` at signup for store creation

> **Note:** Store creation currently happens in the dashboard via `StoreOnboarding`. The sign-up form collects the data but the actual store row insertion should happen after email confirmation via trigger or `StoreOnboarding`. See [Section 24](#24-known-issues--pending-work).

### Auth Callback (`app/auth/callback/route.ts`)

Required for Supabase email link flows. Exchanges the `?code=` param for a session.

---

## 14. Feature: Seller Dashboard

### Dashboard Layout (`app/dashboard/layout.tsx`)

Wraps all `/dashboard/*` pages. Renders:
- `<DashboardSidebar>` (left)
- `<TrialBanner>` (top, only when `status === "trial"`)
- `{children}` (main content)
- OR `<BlockedStoreScreen>` if store is blocked/paused (replaces everything)

### Overview Page (`app/dashboard/page.tsx`)

Shows:
- Store name + status badge
- Stats: total products, active count, featured count, WhatsApp number
- Shareable store link with copy button and open-in-new-tab button
- Empty state with CTA if no products
- OR `<StoreOnboarding>` if store doesn't exist yet

### Store Onboarding (`components/dashboard/StoreOnboarding.tsx`)

First-time setup. Collects `name` + `whatsappNumber`. Calls `createStore()` server action.

### Products Page (`app/dashboard/products/page.tsx`)

Fetches products by `store_id` (using `owner_id` to find the store first). Renders `<ProductListTable>`.

### ProductListTable (`components/dashboard/ProductListTable.tsx`)

| Feature | Implemented |
|---|---|
| List all products with image, title, price, status badges | Yes |
| Edit button → `/dashboard/products/[id]/edit` | Yes |
| Delete with confirmation | Yes (calls `deleteProduct` action) |
| Copy product link button | Yes |
| Featured badge | Yes |
| Active/Inactive badge | Yes |

### ProductForm (`components/dashboard/ProductForm.tsx`)

Used for both add and edit. react-hook-form + `productSchema`. Fields:
- Title, price, description (textarea)
- Images (array of HTTPS URLs — add/remove)
- Featured toggle (checkbox)
- Active toggle (checkbox)

Calls `createProduct()` or `updateProduct()` server action.

### Store Settings (`app/dashboard/settings/page.tsx` + `StoreSettingsForm.tsx`)

Form fields:
- Store name
- WhatsApp number (E.164)
- Tagline
- Logo URL (HTTPS)
- Banner URL (HTTPS)
- Theme selector: Minimal / Modern / Luxury

Calls `updateStore()` server action.

### DashboardSidebar (`components/dashboard/DashboardSidebar.tsx`)

- Logo + MicroStore branding
- Nav links: Overview, Products, Settings
- Store status pill at bottom
- User email + sign out button

### TrialBanner (`components/dashboard/TrialBanner.tsx`)

- Hidden if `status !== "trial"`
- Blue banner: shows days remaining
- Amber banner: when `daysRemaining <= 3`
- Red banner: when trial expired
- "Contact Support" / "Upgrade" link → `mailto:support@microstore.com`

### BlockedStoreScreen (`components/dashboard/BlockedStoreScreen.tsx`)

Full-page replacement when store is blocked or paused. Shows icon, message, and support contact button.

### CopyButton (`components/dashboard/CopyButton.tsx`)

Client component. Copies text to clipboard via `navigator.clipboard`. Shows "Copied!" feedback for 2 seconds.

---

## 15. Feature: Public Storefront

URL pattern: `/s/[storeSlug]`

### Storefront Layout (`app/s/[storeSlug]/layout.tsx`)

- Fetches store by slug
- If store not found → `notFound()`
- If store is blocked/paused → renders `<StoreUnavailable>`
- Sets `data-theme` attribute on wrapper div (`"minimal"`, `"modern"`, or `"luxury"`)
- Applies `storefront-theme` CSS class which activates theme CSS variables
- Renders `<StoreNavbar>` and `{children}`

### Store Home (`app/s/[storeSlug]/page.tsx`)

- Shows banner image (if set)
- Shows logo + store name
- Shows **featured products** first; falls back to all products if no featured
- "View all" link → `/s/[slug]/products`
- Products in a responsive grid (2 → 3 → 4 columns)

### Products Page (`app/s/[storeSlug]/products/page.tsx`)

- All active products for the store in a grid

### Product Detail (`app/s/[storeSlug]/[productSlug]/page.tsx`)

- Main image (aspect-square)
- Thumbnail gallery (if multiple images)
- Title, price (Indian rupee format)
- Description
- `<WhatsAppButton>` — the main CTA

### WhatsAppButton (`components/store/WhatsAppButton.tsx`)

- Builds `wa.me/` URL with pre-filled message containing product title, price, and product URL
- Opens in new tab
- Green button styled with `bg-[#25D366]`

### ProductCard (`components/store/ProductCard.tsx`)

- Product image with fallback icon
- Title, price
- Links to product detail page
- Applies theme CSS variables via `store-card` and `store-primary-text` classes

### StoreNavbar (`components/store/StoreNavbar.tsx`)

- Store name + logo
- "All Products" link
- WhatsApp icon link to store-level WhatsApp inquiry

### Theming

Three themes are selectable from dashboard settings. They are applied via CSS custom properties:

```css
[data-theme="minimal"]  /* white bg, green primary */
[data-theme="modern"]   /* teal bg, rounded buttons */
[data-theme="luxury"]   /* dark bg, gold primary */
```

CSS is defined in `app/globals.css` under `STOREFRONT THEME OVERRIDES`.

---

## 16. Feature: Super Admin Panel

URL pattern: `/admin/*`

Access: only users with `user_metadata.role === "admin"`.

### Admin Layout (`app/admin/layout.tsx`)

- Auth check
- Renders `<AdminSidebar>` + `{children}`

### Admin Overview (`app/admin/page.tsx`)

Calls `getAdminStats()`. Displays:
- Total Stores, Total Products, Active Stores, Trial Stores
- Alert cards: trials expiring soon, blocked stores, paused stores

### Admin Stores (`app/admin/stores/page.tsx`)

Table with columns: Store name, Status badge, Product count, Trial days remaining, Created date, Actions dropdown.

### Store Detail (`app/admin/stores/[storeId]/page.tsx`)

- Store info cards: WhatsApp, product count, trial/created date
- Actions dropdown
- Full products table for that store

### Admin Products (`app/admin/products/page.tsx`)

All products across all stores. Columns: Product (image + title), Store (link), Price, Status, Created, View link.

### AdminStoreActions (`components/admin/AdminStoreActions.tsx`)

Dropdown menu with:
- **Block** → calls `blockStore()`
- **Pause** → calls `pauseStore()`
- **Activate** → calls `activateStore()`
- **Extend Trial** → opens dialog, asks for days (validated 1-365), calls `extendTrial()`
- **Delete** → confirmation dialog, calls `deleteStore()`

Each action shows a toast/alert on success/failure. Uses `useTransition` for loading states.

### AdminSidebar (`components/admin/AdminSidebar.tsx`)

- "Admin Panel" header
- Nav: Overview, Stores, Products
- Sign out button

### StoreStatusBadge (`components/admin/StoreStatusBadge.tsx`)

Colored badge component that takes `status` and `isBlocked` props.

---

## 17. Store Status Lifecycle

```
                   ┌─────────────────────────────────────┐
    Sign Up        │                                     │
  ──────────►  [trial]  ──► expires ──► admin pauses ──► [paused]
                   │                                     │
                   │ admin activates                     │ admin activates
                   ▼                                     ▼
              [active]  ◄─────────────────────────────────
                   │
                   │ admin blocks (policy violation)
                   ▼
              [blocked]  ──► admin activates ──► [active]
```

| Status | Public Storefront | Dashboard | Can Add Products |
|---|---|---|---|
| `trial` | Visible | Full access | Yes |
| `active` | Visible | Full access | Yes |
| `paused` | `StoreUnavailable` shown | `BlockedStoreScreen` shown | No |
| `blocked` | `StoreUnavailable` shown | `BlockedStoreScreen` shown | No |

---

## 18. Trial & Subscription System

**This is fully manual.** There is no payment gateway.

### Trial Flow

1. Seller signs up → store created with `status = "trial"`, `trial_ends_at = NOW + 7 days`
2. `TrialBanner` in the dashboard shows remaining days
3. When `daysRemaining <= 3`: banner turns amber (urgent)
4. When `daysRemaining <= 0`: banner shows "Trial expired" in red
5. Admin sees "expiring soon" alert on admin overview
6. Admin manually decides to activate, extend, or block the store

### Admin Actions for Subscription Management

| Action | What it does | When to use |
|---|---|---|
| **Activate** | Sets `status = "active"` | Seller has paid |
| **Extend Trial** | Adds N days to trial | Giving grace period |
| **Pause** | Sets `status = "paused"` | Non-payment, temporary |
| **Block** | Sets `status = "blocked"` | Policy violation |

### Where to Add Payment Integration (Future)

When a payment gateway is added:
- Add a webhook handler in `app/api/webhook/payment/route.ts`
- On successful payment: call `activateStore(storeId)` 
- On failed payment: call `pauseStore(storeId)`
- Store payment metadata in a new `subscriptions` table

---

## 19. Theming System

Three themes are available, stored as `theme_id` on the `stores` table.

### Theme Definitions

Defined in `types/index.ts` under `THEMES` constant:

```ts
THEMES.minimal   // White bg, green primary, rounded buttons
THEMES.modern    // Teal bg, darker teal primary, pill buttons
THEMES.luxury    // Dark (#1a1a1a) bg, gold (#d4af37) primary, square buttons
```

### How Themes Are Applied

1. Store's `theme_id` is read in `app/s/[storeSlug]/layout.tsx`
2. Layout sets `data-theme="minimal|modern|luxury"` on the wrapper div
3. CSS in `app/globals.css` defines CSS custom properties per `[data-theme]` selector:
   - `--store-bg`, `--store-card-bg`, `--store-text`, `--store-text-muted`
   - `--store-primary`, `--store-border`, `--store-btn-radius`
4. Components use semantic classes: `store-card`, `store-primary-btn`, `store-primary-text`, `store-border`

### Theme Preview in Settings

The settings form (`StoreSettingsForm.tsx`) shows a visual theme selector with 3 options. **The theme preview in the selector is not yet interactive** — it only highlights the selected theme. See [Section 24](#24-known-issues--pending-work).

---

## 20. WhatsApp Integration

WhatsApp ordering is the core of the platform. No backend is involved — it's a deep link.

### URL Format

```
https://wa.me/{phone}?text={encodedMessage}
```

### Message Format (Product Order)

```
Hi! I'm interested in:

*{product.title}*
Price: ₹{price}

{productUrl}
```

Built by `buildWhatsAppUrl()` in `lib/queries.ts`.

### Message Format (Store Inquiry)

```
Hi! I found your store "{storeName}" and wanted to ask about your products.
```

Built by `buildStoreWhatsAppUrl()` in `lib/queries.ts`.

### Phone Number Handling

- Stored in E.164 format (e.g. `+919876543210`)
- Validated by `VALIDATION_PATTERNS.PHONE_E164` regex
- All non-digit characters stripped before building the `wa.me` URL

---

## 21. Security Architecture

### Layers of Security

| Layer | What it does | Where |
|---|---|---|
| Zod validation (client) | Validates form input before submit | All forms via react-hook-form |
| Zod validation (server) | Re-validates all input in server actions | First step of every action |
| Auth check | Verifies session exists | `getAuthenticatedUser()` in every action |
| Ownership check | Verifies user owns the resource | `verifyStoreOwnership()`, `verifyProductOwnership()` |
| Admin check | Verifies `role === "admin"` | `verifyAdmin()` in every admin action |
| RLS policies | Database-level row access control | Supabase (see `supabase.md`) |
| Middleware | Redirects unauthenticated users | `lib/supabase/middleware.ts` |
| Input sanitization | Strips XSS characters from text | `sanitizeString()` before every DB insert |

### Key Security Rules

- **Never trust client data.** Every server action re-validates with Zod regardless of client-side validation.
- **Never skip ownership verification.** Even if RLS is set up, actions explicitly check ownership.
- **Admin actions always call `verifyAdmin()` first.** Never assume from the URL alone.
- **All text inputs are sanitized** with `sanitizeString()` before being written to the database.
- **Image URLs must be HTTPS** — validated by `VALIDATION_PATTERNS.HTTPS_URL`.
- **Phone numbers must be E.164** — validated by `VALIDATION_PATTERNS.PHONE_E164`.

---

## 22. Component Index

| Component | Path | Type | Description |
|---|---|---|---|
| `AdminSidebar` | `components/admin/AdminSidebar.tsx` | Client | Admin nav sidebar |
| `AdminStoreActions` | `components/admin/AdminStoreActions.tsx` | Client | Block/pause/activate/extend/delete dropdown |
| `StoreStatusBadge` | `components/admin/StoreStatusBadge.tsx` | Client | Colored status badge |
| `BlockedStoreScreen` | `components/dashboard/BlockedStoreScreen.tsx` | Client | Full-page blocked/paused state |
| `CopyButton` | `components/dashboard/CopyButton.tsx` | Client | Clipboard copy with feedback |
| `DashboardSidebar` | `components/dashboard/DashboardSidebar.tsx` | Client | Seller nav sidebar |
| `ProductForm` | `components/dashboard/ProductForm.tsx` | Client | Add/edit product form |
| `ProductListTable` | `components/dashboard/ProductListTable.tsx` | Client | Products table with actions |
| `StoreOnboarding` | `components/dashboard/StoreOnboarding.tsx` | Client | First store setup form |
| `StoreSettingsForm` | `components/dashboard/StoreSettingsForm.tsx` | Client | Store settings form |
| `TrialBanner` | `components/dashboard/TrialBanner.tsx` | Client | Trial days remaining banner |
| `ProductCard` | `components/store/ProductCard.tsx` | Client | Storefront product grid card |
| `StoreNavbar` | `components/store/StoreNavbar.tsx` | Client | Public store top navbar |
| `StoreUnavailable` | `components/store/StoreUnavailable.tsx` | Client | Shown when store is blocked/paused |
| `WhatsAppButton` | `components/store/WhatsAppButton.tsx` | Client | "Order on WhatsApp" CTA button |

---

## 23. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL (e.g. `https://yourdomain.com`). Used for building shareable product URLs. |

Set in Vercel → Project Settings → Environment Variables.

`NEXT_PUBLIC_APP_URL` is used in:
- `app/dashboard/page.tsx` — building the shareable store URL
- `app/s/[storeSlug]/[productSlug]/page.tsx` — building the product URL sent in the WhatsApp message

If `NEXT_PUBLIC_APP_URL` is not set, it falls back to an empty string, which breaks WhatsApp links.

---

## 24. Known Issues & Pending Work

### Bugs

| # | Issue | Location | How to Fix |
|---|---|---|---|
| B1 | `NEXT_PUBLIC_APP_URL` missing causes broken WhatsApp links | `app/dashboard/page.tsx`, `app/s/.../[productSlug]/page.tsx` | Ensure env var is set in Vercel. Consider auto-detecting with `headers()` from `next/headers` |
| B2 | `BlockedStoreScreen` has a template literal bug in the email href: `{store.name}` is not interpolated | `components/dashboard/BlockedStoreScreen.tsx` line ~53 | Change to `\`...${store.name}\`` |
| B3 | Sign-up collects `storeName` but does not create the store — store creation still requires onboarding | `app/auth/sign-up/page.tsx` | Either create store after email confirmation via trigger, or pre-fill onboarding form with sign-up data |

### Missing Features (Not Yet Implemented)

| # | Feature | Where to Add |
|---|---|---|
| M1 | Analytics tracking calls on storefront | Call `trackEvent()` in `app/s/[storeSlug]/page.tsx` (page view) and `WhatsAppButton.tsx` (click) |
| M2 | Analytics dashboard in seller dashboard | New page: `app/dashboard/analytics/page.tsx` using `getAnalyticsSummary()` |
| M3 | Product count limit enforcement | Add check in `createProduct()` using `PRODUCT_LIMITS.MAX_PRODUCTS_FREE` |
| M4 | Theme live preview in settings | In `StoreSettingsForm.tsx`, add a mini preview card that updates as theme is selected |
| M5 | Admin: seller email visible | Admin stores table doesn't show seller email. Need to join `auth.users` or store email in `stores` table |
| M6 | Admin: search/filter stores | Admin stores table has no search. Add `?q=` URL param filter |
| M7 | Admin: pagination | Both admin stores and products tables load all rows — needs pagination for scale |
| M8 | Image upload | Currently images require HTTPS URLs. Could add Vercel Blob upload in `ProductForm` |
| M9 | Sign-up: auto-create store | Store name + WhatsApp collected at sign-up but not used to auto-create store |
| M10 | Storefront: product image click-to-expand | Product detail shows thumbnails but no lightbox |
| M11 | Mobile sidebar | Dashboard and admin sidebars are always visible — need a mobile hamburger menu |

### Pending Supabase Setup

Before the app works at all, you must run the SQL in `supabase.md`. Key items:
- Create `stores`, `products`, `analytics_events` tables
- Enable RLS and add all policies
- Create the `update_updated_at_column()` trigger function
- Create the storage bucket `store-assets` (for future image uploads)
- Create the first admin user

---

## 25. How to Add New Features

### Adding a New Dashboard Page

1. Create `app/dashboard/your-page/page.tsx` as an `async` Server Component
2. At the top, fetch the user and their store using `createClient()` from `@/lib/supabase/server`
3. Add the route to `ROUTES` in `lib/constants.ts`
4. Add a nav link in `components/dashboard/DashboardSidebar.tsx`
5. If the page has a form, create the Zod schema in `lib/validations.ts` and the server action in `lib/actions/`

### Adding a New Admin Page

1. Create `app/admin/your-page/page.tsx`
2. Add auth check at the top: fetch user and verify with `getAdminStats()` pattern or directly with `createClient()`
3. Add the route to `ROUTES` in `lib/constants.ts`
4. Add a nav link in `components/admin/AdminSidebar.tsx`
5. If it has mutations, add admin server actions in `lib/actions/admin.ts` — always call `verifyAdmin()` first

### Adding a New Storefront Section

1. Modify `app/s/[storeSlug]/page.tsx` or create a new sub-route under `app/s/[storeSlug]/`
2. Use theme CSS classes (`store-card`, `store-primary-text`, etc.) so the theme applies
3. Read the store's `theme_id` from the layout context if needed

### Adding a New Server Action

1. Add to the appropriate file in `lib/actions/`
2. Mark file with `"use server"` at top
3. First step: validate with Zod
4. Second step: authenticate with `getAuthenticatedUser()`
5. Third step: authorize (ownership or admin check)
6. Fourth step: execute the DB operation
7. Fifth step: `revalidatePath()` affected routes
8. Return `ActionResult<T>`

### Adding a New Zod Schema

1. Add to `lib/validations.ts`
2. Use constants from `lib/constants.ts` for limits and patterns
3. Export the schema and its inferred type
4. Use `sanitizeString()` on any text fields before DB writes

---

## 26. How to Fix Bugs

### Step-by-step approach for any bug fix

1. **Identify the file** using the Routing Map (Section 4) and Component Index (Section 22)
2. **Read the file** before editing — never edit blindly
3. **Check the action** involved — most logic lives in `lib/actions/` not in components
4. **Check the type** — verify against `types/index.ts` that you're using the right field names
5. **Check constants** — if a limit or pattern is wrong, fix it in `lib/constants.ts` not inline
6. **Check the schema** — if validation is wrong, fix the Zod schema in `lib/validations.ts`
7. **Test the ownership chain** — for seller mutations: user → store (`owner_id`) → product (`store_id`)
8. **Revalidate the right path** after mutations using `revalidatePath(ROUTES.xxx)`

### Debugging Server Actions

Add `console.error("[actionName] Error:", error)` to identify which step failed. These already exist in all current actions.

### Common Pitfalls

- Forgetting `await params` — all Next.js 15 dynamic params are Promises (`const { storeSlug } = await params`)
- Using `user_id` instead of `owner_id` — the column on `stores` is `owner_id`
- Using `supabase.auth.getSession()` — always use `supabase.auth.getUser()` for security
- Calling a server action from a server component — server actions are for client components; use queries in server components
- Missing `revalidatePath()` after mutations — data won't update without it
