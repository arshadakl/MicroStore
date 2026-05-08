# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server (Next.js)
pnpm build      # Production build
pnpm lint       # ESLint
```

No test suite is configured. There is no `test` script.

## What This Project Is

MicroStore is a WhatsApp-first micro-store SaaS for Indian Instagram sellers. Sellers list products; customers order via a WhatsApp deep link. No cart, no checkout, no payment gateway. Business model is manual: admin activates/blocks/pauses stores from the admin panel after a 7-day trial.

## Architecture Overview

### Three user zones, one codebase

| Zone | URL | Access |
|---|---|---|
| Seller dashboard | `/dashboard/*` | Authenticated sellers |
| Super admin panel | `/admin/*` | Users with `app_metadata.role === "admin"` |
| Public storefront | `/s/[storeSlug]/*` | Anyone |

### Data flow rule

**Server Components call queries → Client Components call server actions → server actions call Supabase.**

- Read-only DB calls live in `lib/queries.ts` — call these from page Server Components only.
- All mutations are Next.js Server Actions in `lib/actions/` — call these from Client Components via `useTransition`.
- Never write directly to Supabase from a Client Component.

### Server action pattern (mandatory order)

Every action in `lib/actions/` must follow this sequence:
1. Validate with Zod (`lib/validations.ts`)
2. `getAuthenticatedUser()` — always use `getUser()`, never `getSession()`
3. Ownership/admin check (`verifyStoreOwnership`, `verifyProductOwnership`, or `verifyAdmin`)
4. Execute DB operation with `sanitizeString()` on all text fields
5. `revalidatePath(ROUTES.xxx)` then return `ActionResult<T>`

All actions return `ActionResult<T> = { success: boolean; error?: string; data?: T }`.

### Key files and their roles

| File | Role |
|---|---|
| `lib/constants.ts` | All limits, patterns, error/success messages, and `ROUTES`. Never hardcode routes or limits inline. |
| `lib/validations.ts` | All Zod schemas + `sanitizeString`, `generateSlug`, `isValidUUID`, `formatPhoneNumber` |
| `lib/queries.ts` | Read-only Supabase queries + `buildWhatsAppUrl`, `formatPrice`, `slugify` |
| `types/index.ts` | All shared TS types, enums, `THEMES` constant, and helper functions like `getTrialDaysRemaining` |
| `lib/supabase/middleware.ts` | Session refresh + route protection logic (redirects unauthenticated users, role-based routing) |

### Authentication & roles

- Sessions are stored in cookies; read via `lib/supabase/server.ts` (`createClient()`).
- Admin role: `user.app_metadata.role === "admin"` — set via Supabase dashboard or SQL (`raw_app_meta_data`).
- Admin actions: always call `verifyAdmin()` first (checks JWT app_metadata, not user_metadata).
- Middleware adds `x-store-blocked` header when a seller's store is blocked; dashboard layout reads this header to render `<BlockedStoreScreen>`.

### Theming (storefront only)

The public storefront supports three themes (`minimal`, `modern`, `luxury`). The store layout sets `data-theme="..."` on a wrapper div; CSS custom properties in `app/globals.css` under `STOREFRONT THEME OVERRIDES` provide `--store-bg`, `--store-primary`, etc. Storefront components must use semantic classes (`store-card`, `store-primary-btn`, `store-primary-text`, `store-border`) — not raw colors — so themes apply correctly.

### Common pitfalls

- **Next.js 15 dynamic params are Promises.** Always `const { storeSlug } = await params`.
- **Route strings**: import from `ROUTES` in `lib/constants.ts`, never hardcode.
- **`owner_id`** is the FK column on `stores` (not `user_id`).
- **Text inputs** must be passed through `sanitizeString()` before any DB write.
- **Image URLs** must pass `VALIDATION_PATTERNS.HTTPS_URL`; phone numbers must pass `VALIDATION_PATTERNS.PHONE_E164`.
- **Missing `revalidatePath`** after mutations means the UI won't update.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
NEXT_PUBLIC_APP_URL            # Full app URL — required for WhatsApp deep links to work

# Server-only (no NEXT_PUBLIC_ prefix)
CLOUDINARY_CLOUD_NAME          # Cloudinary cloud name
CLOUDINARY_API_KEY             # Cloudinary API key (non-secret identifier)
CLOUDINARY_API_SECRET          # Cloudinary API secret — NEVER expose to the client
```

`NEXT_PUBLIC_APP_URL` is used to construct shareable product URLs embedded in WhatsApp messages. If missing, WhatsApp links silently break.

## Image Upload (Cloudinary Signed Uploads)

Images are uploaded directly from the browser to Cloudinary using a short-lived server-signed token. The `api_secret` never leaves the server.

**Flow:** `ImageUploader` component → `POST /api/cloudinary/sign` (verifies Supabase session, returns signed params) → browser uploads directly to Cloudinary → `secure_url` stored in `products.images[]` or `stores.logo_url` / `stores.banner_url`.

**Key files:**
- `app/api/cloudinary/sign/route.ts` — generates the SHA-1 signature; all upload constraints (folder, max size, allowed formats) are locked into the signature so Cloudinary enforces them server-side
- `lib/cloudinary.ts` — `uploadToCloudinary(file)` helper used by client components
- `components/dashboard/ImageUploader.tsx` — reusable uploader; accepts `value: string[]` + `onChange`; use `maxImages={1}` for single-image fields (logo/banner)
- `lib/constants.ts` `CLOUDINARY_UPLOAD_LIMITS` — single source of truth for file size and format constraints

## Database

Full SQL setup is in `supabase.md` and `scripts/002_supabase_setup.sql`. Three tables: `stores`, `products`, `analytics_events`. All have RLS enabled. Admin reads bypass RLS using a service role check on `app_metadata.role`. The `store-assets` storage bucket exists for future image uploads (not yet wired into the UI — images are currently HTTPS URLs only).

## Known Gaps (from `project.md` §24)

- **B2**: `BlockedStoreScreen` has a broken template literal for the support email — `{store.name}` is not interpolated.
- **M1/M2**: Analytics `trackEvent()` is defined but never called from storefront pages.
- **M3**: Product count limit (`PRODUCT_LIMITS.MAX_PRODUCTS_FREE`) is not enforced in `createProduct`.
- ~~**M8**: Image upload not implemented~~ — resolved: Cloudinary signed upload implemented.
