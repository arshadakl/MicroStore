# MicroStore → Astro Migration Feasibility Report

Generated: 2026-05-09  
Project: MicroStore (WhatsApp-first micro-store SaaS)  
Stack: Next.js 16.2 + React 19 + Supabase + Cloudinary + Tailwind v4

---

## Phase 1 — Project Discovery

### Package Summary

| Category | Key Packages |
|---|---|
| Framework | `next@16.2.0`, `react@^19`, `react-dom@^19` |
| Auth/DB | `@supabase/ssr@^0.10.2` |
| UI | 25 `@radix-ui/*` packages, `shadcn/ui` pattern |
| Forms | `react-hook-form@^7.54`, `@hookform/resolvers`, `zod@^3.24` |
| Charts | `recharts@2.15.0` |
| Image crop | `react-easy-crop@^5.5.7` |
| Date picker | `react-day-picker@9.13.2`, `date-fns@4.1.0` |
| Themes | `next-themes@^0.4.6` |
| Analytics | `@vercel/analytics@1.6.1` |
| CSS | `tailwindcss@^4.2`, `tw-animate-css` |
| Fonts | `next/font/google` (Geist, Geist_Mono) |

No test suite. No `engines` field. TypeScript strict mode. `ignoreBuildErrors: true`.

### next.config.mjs

```js
{
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }   // ← next/image optimization disabled globally
}
```

Critical note: `images.unoptimized: true` means `<Image>` renders as a plain `<img>` — no Vercel image CDN used. This eliminates a migration blocker.

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | Used to build WhatsApp deep links |
| `CLOUDINARY_CLOUD_NAME` | Server-only |
| `CLOUDINARY_API_KEY` | Server-only |
| `CLOUDINARY_API_SECRET` | Server-only — never client-exposed |

### middleware.ts

Thin wrapper that delegates to `lib/supabase/middleware.ts::updateSession()`.  
Matcher: all paths except static assets and images.

---

## Phase 2 — Routing & Page Analysis

All routes use the **App Router** (Next.js 13+ app directory). No Pages Router.  
Next.js 15 pattern: `params` typed as `Promise<{...}>` and `await`ed.

| Route | Type | Rendering | Dynamic | Next-specific APIs Used |
|---|---|---|---|---|
| `/` | Server Component | SSR | No | next/link, redirect (if used) |
| `/auth/login` | Client Component | CSR | No | next/link, createBrowserClient |
| `/auth/sign-up` | Client Component | CSR | No | next/link, createBrowserClient |
| `/auth/forgot-password` | Client Component | CSR | No | createBrowserClient |
| `/auth/reset-password` | Client Component | CSR | No | createBrowserClient |
| `/auth/error` | Server + Client | SSR | No | next/navigation (searchParams) |
| `/auth/callback` | API Route (GET) | Server | No | NextResponse, NextRequest, next/headers |
| `/auth/confirm` | API Route (GET) | Server | No | NextResponse, NextRequest, next/headers |
| `/api/cloudinary/sign` | API Route (POST) | Server | No | NextResponse, next/headers |
| `/dashboard` | Server Component | SSR | No | redirect, next/link, next/cache (via actions) |
| `/dashboard/layout.tsx` | Server Component | SSR | No | redirect, next/headers (via createClient) |
| `/dashboard/analytics` | Server Component | SSR | No | redirect, next/headers |
| `/dashboard/categories` | Server Component | SSR | No | redirect |
| `/dashboard/products` | Server Component | SSR | No | redirect |
| `/dashboard/products/new` | Server Component + CC form | SSR | No | next/navigation, next/headers |
| `/dashboard/products/[id]/edit` | Server Component + CC form | SSR | Yes `[id]` | await params, next/headers |
| `/dashboard/settings` | Server Component + CC form | SSR | No | next/headers |
| `/admin` | Server Component | SSR | No | redirect, next/link, next/headers |
| `/admin/layout.tsx` | Server Component | SSR | No | redirect, next/headers |
| `/admin/stores` | Server Component | SSR | No | next/headers |
| `/admin/stores/[storeId]` | Server Component | SSR | Yes `[storeId]` | await params, next/headers |
| `/admin/products` | Server Component | SSR | No | next/headers |
| `/s/[storeSlug]` | Server Component | SSR | Yes `[storeSlug]` | await params, next/image, next/link, next/headers |
| `/s/[storeSlug]/layout.tsx` | Server Component | SSR | Yes | generateMetadata, await params, next/headers |
| `/s/[storeSlug]/[productSlug]` | Server Component | SSR | Yes (2 segments) | await params, next/image, generateMetadata, next/headers |
| `/s/[storeSlug]/products` | Server Component | SSR | Yes | await params |

**loading.tsx files:** analytics, categories, dashboard root, products, settings — all use Next.js route-level Suspense loading.

**No** `generateStaticParams` used anywhere — all pages are fully dynamic SSR.  
**No** ISR (`revalidate` numbers, `revalidateTag`). Cache invalidation is done exclusively via `revalidatePath()` after mutations.

---

## Phase 3 — Supabase Integration Audit

### Which clients are used

| File | Client | Location | Operations |
|---|---|---|---|
| `lib/supabase/server.ts` | `createServerClient` from `@supabase/ssr` | Server-side | Auth (getUser), DB queries, cookie read/write via `next/headers cookies()` |
| `lib/supabase/client.ts` | `createBrowserClient` from `@supabase/ssr` | Client-side | Auth (signIn, signOut, OAuth) |
| `lib/supabase/middleware.ts` | `createServerClient` from `@supabase/ssr` | Next.js middleware | Auth (getUser), session refresh, DB query (store blocked check), cookie manipulation via NextRequest/NextResponse |

### Critical findings

- **`@supabase/ssr` used exclusively.** No `@supabase/auth-helpers-nextjs`. This is the good news: `@supabase/ssr` is framework-agnostic and works in Astro. The client instantiation code needs rewriting but the underlying library stays.
- **No Supabase Realtime.** Zero `channel`, `on('postgres_changes')`, or `subscribe` calls anywhere. Clean migration.
- **No Supabase Storage.** Images are stored in Cloudinary. The `store-assets` bucket exists in Supabase but is not wired into the codebase.
- **No RPC or Edge Function calls.** All DB access is PostgREST queries via the Supabase client.
- **Cookie coupling in server.ts:** `createClient()` calls `cookies()` from `next/headers`. This function is Next.js-specific and does not exist in Astro. Full rewrite required for the server client factory.

### Supabase operations map

| Operation | Where Called | Pattern |
|---|---|---|
| `auth.getUser()` | middleware, all server action files, all layout.tsx, dashboard pages | Server-side |
| `auth.signInWithPassword()` | LoginPage (client) | Client-side |
| `auth.signInWithOAuth({ provider: 'google' })` | GoogleAuthButton (client) | Client-side |
| `auth.signOut()` | DashboardSidebar (client) | Client-side |
| `auth.verifyOtp()` | /auth/callback, /auth/confirm API routes | Server-side |
| `auth.exchangeCodeForSession()` | /auth/callback API route | Server-side |
| DB `.from(...).select/insert/update/delete` | lib/queries.ts, all lib/actions/*.ts | Server-side |

---

## Phase 4 — Authentication Flow Audit

### 1. Session establishment methods

- **Email + password:** `supabase.auth.signInWithPassword()` called client-side from LoginPage
- **Google OAuth:** `supabase.auth.signInWithOAuth({ provider: 'google' })` called client-side from GoogleAuthButton; redirect goes to `/auth/callback?next=/dashboard`
- **Magic link / OTP:** `/auth/confirm` route handles `token_hash` verification (used by email confirmation flows)

### 2. Server-side session reads

- `lib/supabase/middleware.ts`: `createServerClient` with cookie manipulation on `NextRequest`/`NextResponse`
- `lib/supabase/server.ts`: `createServerClient` via `cookies()` from `next/headers`
- All server components and server actions call `createClient()` from `lib/supabase/server.ts`, which then calls `supabase.auth.getUser()` to get the authenticated user

### 3. Client-side auth state

- No `onAuthStateChange` listeners anywhere
- No client-side session checks beyond form submit handlers (login/signup pages check errors from `signInWithPassword`)
- After successful login, pages redirect via `window.location.href` (not router.push), which forces a full page reload and picks up the new session cookie

### 4. Protected route enforcement (two layers)

**Layer 1 — Middleware** (`lib/supabase/middleware.ts`):
- No user → redirect dashboard/admin routes to `/auth/login`
- Authenticated user on auth route → redirect to `/admin` or `/dashboard`
- Non-admin on `/admin/*` → redirect to `/dashboard`
- Dashboard route: queries DB for store blocked status, sets `x-store-blocked: true` header

**Layer 2 — Layout guards** (`app/dashboard/layout.tsx`, `app/admin/layout.tsx`):
- Re-verify `getUser()` and `isAdminUser()`
- Call `redirect()` if not authorized
- This is defense-in-depth: layouts won't trust middleware alone

### 5. Token refresh

Handled in `lib/supabase/middleware.ts::updateSession()`. The `setAll` cookie callback propagates refreshed tokens from Supabase back into the response cookies. This runs on every non-static request.

### 6. RBAC

Single role check: `user.app_metadata.role === "admin"` via `isAdminUser()` in `lib/supabase/roles.ts`.  
Checked in: middleware, dashboard layout, admin layout, every admin server action via `verifyAdmin()`.

### 7. Server-side redirects

Middleware redirects:
- `/dashboard/*` when not authenticated → `/auth/login`
- `/admin/*` when not authenticated → `/auth/login`
- `/auth/*` (except callback, reset-password) when authenticated → `/admin` or `/dashboard`
- `/admin/*` when authenticated but not admin → `/dashboard`

Layout redirects (defense-in-depth):
- Dashboard layout: `if (!user) redirect('/auth/login')`, `if (isAdmin) redirect('/admin')`
- Admin layout: `if (!user) redirect('/auth/login')`, `if (!isAdmin) redirect('/dashboard')`

### 8. Middleware logic detail

```
updateSession():
  1. Create Supabase server client (cookie-aware for request/response)
  2. Call auth.getUser() — validates JWT against Supabase Auth server
  3. Route-based logic:
     - unauthenticated + protected route → redirect to login
     - authenticated + auth route (not callback/reset) → redirect to app
     - authenticated + admin route + not admin → redirect to dashboard
     - authenticated + dashboard route + not admin → check store blocked status, set header
  4. Return response with (possibly) refreshed cookies
```

**Uses `getUser()` not `getSession()`.** This is correct per Supabase security guidance. `getUser()` validates the JWT against the Supabase Auth server on every request, while `getSession()` only reads from the cookie without server-side validation.

### 9. OAuth callback route

`/auth/callback` (GET):
- Handles `code` param (OAuth PKCE code exchange via `exchangeCodeForSession`)
- Handles `token_hash` + `type` param (OTP verification via `verifyOtp`)
- Validates `next` redirect param: must start with `/` and not `//` — open redirect protection ✅
- Handles provider-returned errors: redirects to `/auth/error`

### 10. Email confirmation / password reset

- `/auth/confirm` (GET): OTP verification (`token_hash` + `type` params)
- `/auth/forgot-password`: Client component, calls `supabase.auth.resetPasswordForEmail()`
- `/auth/reset-password`: Client component, calls `supabase.auth.updateUser()`

### Security audit findings

| Check | Status | Notes |
|---|---|---|
| Uses `getUser()` not `getSession()` server-side | ✅ PASS | Correct throughout |
| Sensitive data in localStorage | ✅ PASS | None found |
| JWT secret exposed to client | ✅ PASS | Only anon key in `NEXT_PUBLIC_*` |
| PKCE for OAuth | ✅ PASS | `signInWithOAuth` + `/auth/callback` code exchange |
| Open redirect in callback | ✅ PASS | `next` param validated |
| Admin check uses `app_metadata` | ✅ PASS | Cannot be spoofed by user (unlike `user_metadata`) |

**One pre-existing bug (not security-critical):** `BlockedStoreScreen` has a broken template literal — `{store.name}` is not interpolated in the support email body (noted in CLAUDE.md as bug B2).

---

## Phase 5 — API Routes & Server Actions Audit

### API Routes

| File | Method | What It Does | Reads Auth | External APIs | Next-Specific APIs |
|---|---|---|---|---|---|
| `app/api/cloudinary/sign/route.ts` | POST | Generates signed Cloudinary upload token | Yes (getUser) | Cloudinary (SHA-1 sig gen only, no HTTP call) | NextResponse, next/headers (via createClient) |
| `app/auth/callback/route.ts` | GET | OAuth code exchange + OTP verification + redirect | Yes (verifyOtp, exchangeCodeForSession) | Supabase Auth | NextResponse, NextRequest |
| `app/auth/confirm/route.ts` | GET | OTP verification + redirect | Yes (verifyOtp) | Supabase Auth | NextResponse, NextRequest |

### Server Actions

All actions in `lib/actions/` have `"use server"` at the top. They depend on:
- `next/cache` (`revalidatePath`) — **Next.js specific**
- `next/headers` (`cookies()`) — **Next.js specific** (indirectly via `createClient()`)

#### `lib/actions/product.ts`
Exports: `createProduct`, `updateProduct`, `deleteProduct`, `toggleProductFeatured`, `toggleProductActive`  
Pattern: Zod validate → `getAuthenticatedUser()` → `getStoreForUser()` → ownership check → DB op → `revalidatePath()`

#### `lib/actions/store.ts`
Exports: `createStore`, `updateStore`, `getMyStore`, `checkStoreAccess`  
Pattern: same as product actions

#### `lib/actions/admin.ts`
Exports: `blockStore`, `unblockStore`, `pauseStore`, `activateStore`, `extendTrial`, `convertToRegular`, `setSubscription`, `toggleProductAdminHidden`, `softDeleteStore`, `restoreStore`, `purgeStore`, `deleteStore`, `getAdminStats`, `getAllStores`, `getStoreWithProducts`, `getAllProducts`  
Also calls `deleteCloudinaryImages()` (external Cloudinary API) for image cleanup.

#### `lib/actions/analytics.ts`
Exports: `trackWhatsAppClick`  
No `revalidatePath`. Simple DB insert.

#### `lib/actions/category.ts`
Exports: `createCategory`, `updateCategory`, `deleteCategory`  
Pattern: same as product actions

---

## Phase 6 — Component & Feature Inventory

### Totals

- **Total components:** ~80+ files (25+ UI, 15 dashboard, 5 store, 4 admin, 3 auth + hooks/utils)
- **"use client" directives:** 23 files

### Client components list

| Component | Hooks Used | Next-Specific |
|---|---|---|
| `app/auth/login/page.tsx` | useState, react-hook-form | next/link |
| `app/auth/sign-up/page.tsx` | useState, react-hook-form | next/link |
| `app/auth/forgot-password/page.tsx` | useState, react-hook-form | — |
| `app/auth/reset-password/page.tsx` | useState, react-hook-form | — |
| `app/auth/error/AuthErrorContent.tsx` | — (reads searchParams) | useSearchParams (next/navigation) |
| `components/auth/GoogleAuthButton.tsx` | useState | window.location.origin |
| `components/dashboard/DashboardSidebar.tsx` | useState | usePathname, next/link |
| `components/dashboard/ProductForm.tsx` | useState, react-hook-form | useRouter, next/link |
| `components/dashboard/StoreSettingsForm.tsx` | useState, react-hook-form | useRouter |
| `components/dashboard/OnboardingModal.tsx` | useState | — |
| `components/dashboard/StoreOnboarding.tsx` | useState, react-hook-form | — |
| `components/dashboard/ProductListTable.tsx` | useState × several | — |
| `components/dashboard/CategoryManager.tsx` | useState × several | — |
| `components/dashboard/ImageUploader.tsx` | useRef, useState, useCallback | fetch (to /api/cloudinary/sign) |
| `components/dashboard/CropModal.tsx` | useRef, useState × several | — |
| `components/dashboard/CopyButton.tsx` | useState | — |
| `components/dashboard/BlockedStoreScreen.tsx` | — | — |
| `components/dashboard/TrialBanner.tsx` | — | — |
| `components/admin/AdminSidebar.tsx` | useState | usePathname |
| `components/admin/AdminStoreActions.tsx` | useState × several | — |
| `components/admin/AdminProductToggle.tsx` | useState | — |
| `components/store/ImageGallery.tsx` | useState | — |
| `components/store/WhatsAppButton.tsx` | — | Calls server action |
| `components/theme-provider.tsx` | — | next-themes |

### next/image usage

Used in `app/s/[storeSlug]/page.tsx` and `/[productSlug]/page.tsx` with `fill` prop.  
**`images: { unoptimized: true }` in next.config.mjs means these render as plain `<img>` tags.** No Vercel image CDN pipeline involved. Easy to replace.

### next/link usage

Used in all layouts and navigation components. Acts as a standard `<a>` tag with client-side prefetching. Replaceable with `<a>` tags in Astro (storefront) or kept as React island links (dashboard).

### next/font

`Geist` and `Geist_Mono` loaded via `next/font/google` in `app/layout.tsx`.  
These are Google Fonts accessible as web fonts independently of Next.js.

### Third-party React libraries

| Library | React-specific | Astro via React Island | Native Astro Alt | Recommendation |
|---|---|---|---|---|
| `@radix-ui/*` (25 packages) | Yes | Yes | No | Keep via @astrojs/react |
| `react-hook-form` | Yes | Yes | No | Keep via React island |
| `react-easy-crop` | Yes | Yes | No | Keep via React island |
| `react-day-picker` | Yes | Yes | No | Keep via React island |
| `recharts` | Yes | Yes | No | Keep via React island |
| `vaul` (drawer) | Yes | Yes | No | Keep via React island |
| `embla-carousel-react` | Yes | Yes | No | Keep via React island |
| `cmdk` | Yes | Yes | No | Keep via React island |
| `next-themes` | React (but not Next-only) | Partial | CSS custom properties | Replace with CSS `[data-theme]` pattern (already started in storefront) |
| `@vercel/analytics` | No | No | `@vercel/analytics/astro` exists | Use Astro integration |
| `lucide-react` | Yes | Yes | `lucide` (framework agnostic) | Keep or switch to SVG imports |
| `sonner` | Yes | Yes | No | Keep via React island |
| `input-otp` | Yes | Yes | No | Keep via React island |
| `date-fns` | No | N/A | N/A | No change needed |
| `zod` | No | N/A | N/A | No change needed |
| `clsx`, `tailwind-merge` | No | N/A | N/A | No change needed |

### Context providers

- `next-themes` `ThemeProvider` is defined in `components/theme-provider.tsx` but is **not imported anywhere in app/layout.tsx**. The theme system is implemented via CSS `[data-theme]` attributes instead. No active global context provider wrapping the app.

### Global state management

**None.** The app uses React Server Component patterns (server = source of truth, mutations via server actions). No Redux, Zustand, Jotai, or React Context for app state.

---

## Phase 7 — Data Fetching Patterns

| Pattern | Where Used | Notes |
|---|---|---|
| Server Components with async/await | All dashboard, admin, storefront pages | Primary pattern |
| Pages Router `getServerSideProps` | Nowhere | App Router only |
| Pages Router `getStaticProps` | Nowhere | App Router only |
| Client-side fetch (useEffect) | `lib/cloudinary.ts` → `fetch('/api/cloudinary/sign')` | Only for upload signing |
| Server Actions (mutations) | All `lib/actions/*.ts` | Called from client components via `useTransition` |
| Route Handlers as API endpoints | 3 routes (cloudinary/sign, callback, confirm) | Used for auth + upload signing |
| ISR / revalidateTag | Nowhere | Not used |
| `revalidatePath` | All mutation server actions | On-demand cache invalidation after writes |
| Suspense streaming | Via `loading.tsx` files (route-level) | analytics, categories, products, settings, dashboard root |
| `generateMetadata` | Store layout, product page | Async metadata for OG/Twitter |

---

## Phase 8 — Infrastructure & Deployment

### Deployment target

- `@vercel/analytics` is installed and rendered in `app/layout.tsx` — explicit Vercel dependency.
- No `vercel.json` file found in project root.
- No `Dockerfile`, no Railway/Fly/Render config.
- Deployment target is almost certainly **Vercel** (implied by `@vercel/analytics`).

### Vercel-specific features audit

| Feature | Used? | Notes |
|---|---|---|
| Vercel Analytics | Yes | `<Analytics />` in root layout, production only |
| Edge Runtime | No | No `export const runtime = 'edge'` anywhere |
| Edge Config | No | Not installed |
| Vercel KV | No | Not installed |
| Vercel Blob | No | Not installed (uses Cloudinary instead) |
| Vercel Speed Insights | No | Not installed |
| Vercel Cron Jobs | No | No vercel.json |
| Vercel Image Optimization | No | `images: { unoptimized: true }` disables it |

---

## Phase 9 — Migration Feasibility Matrix

### A. Feature-by-Feature Compatibility Table

| Feature | Current Implementation | Astro Equivalent | Effort | Risk |
|---|---|---|---|---|
| File-based routing | App Router, all dynamic | Astro file-based routing | Low | Low |
| Dynamic segments | `[slug]`, `[storeSlug]`, `[productSlug]`, `[storeId]` | Astro `[slug].astro`, `[...slug].astro` | Low | Low |
| Auth session (server) | `@supabase/ssr createServerClient` + `next/headers cookies()` | `@supabase/ssr createServerClient` + `Astro.cookies` | Medium | Medium |
| Auth middleware | `updateSession()` in Next.js middleware.ts | Astro `src/middleware.ts` — nearly identical pattern | Low | Low |
| Protected routes | Middleware + layout `redirect()` | Astro middleware + `return Astro.redirect()` in .astro files | Low | Low |
| Admin RBAC | `isAdminUser()` in middleware + actions | Same function, called from Astro middleware | Low | Low |
| OAuth callback | `/auth/callback` Route Handler | Astro API route (`/auth/callback.ts`) | Low | Low |
| Email OTP confirm | `/auth/confirm` Route Handler | Astro API route | Low | Low |
| Password reset | Client component + Supabase client | React island or .astro form | Low | Low |
| Server Components | All dashboard/admin pages | `.astro` components (Astro's native equivalent) | High | Medium |
| Server Actions | `"use server"` functions + `revalidatePath` | **No native equivalent.** Rewrite as Astro API routes + client fetch | High | High |
| `revalidatePath` | After every mutation | Not needed — Astro SSR pages fetch fresh data on every request by default | N/A | Low |
| `next/cache` | Used only for `revalidatePath` | Drop completely | Low | Low |
| `next/headers cookies()` | In `lib/supabase/server.ts` | Rewrite factory to accept `AstroCookies` | Medium | Medium |
| API routes (cloudinary/sign) | `POST /api/cloudinary/sign` | Astro API route `src/pages/api/cloudinary/sign.ts` | Low | Low |
| Client components | 23 files with React | All work as React islands via `@astrojs/react` | Low | Low |
| React hooks | useState, useEffect, etc. in 26 files | Work unchanged inside React islands | None | None |
| `next/image` | Used with `unoptimized: true` | Replace with `<img>` or Astro `<Image>` | Low | None |
| `next/link` | Navigation | Astro: `<a>` tags (storefront) or keep in React islands | Low | None |
| `next/font` | Geist via `next/font/google` | Google Fonts CSS link or `fontsource` npm packages | Low | None |
| `useRouter` (next/navigation) | ProductForm, StoreSettingsForm | Within React islands: use `navigate()` from `astro:transitions` or `window.location` | Medium | Low |
| `usePathname` (next/navigation) | Sidebar active state | Pass current path as Astro prop to React island | Low | Low |
| `generateMetadata` | Store + product pages | Astro frontmatter `<head>` slots | Medium | Low |
| `loading.tsx` | 5 route-level loading states | Astro transitions + client-side loading states | Medium | Medium |
| ISR/caching | `revalidatePath` only | Not applicable (pure SSR) | N/A | None |
| Realtime | Not used | Not needed | N/A | None |
| Global state | None | None needed | None | None |
| next-themes | Defined but not wired up | CSS `[data-theme]` already in use — complete the migration | Low | None |
| @vercel/analytics | `<Analytics />` in root layout | `@vercel/analytics/astro` integration | Low | None |
| Deployment | Vercel (implied) | Vercel Astro adapter (`@astrojs/vercel`) | Low | None |

---

### B. Security Assessment for Astro Migration

**1. Can Supabase SSR cookie-based auth be replicated in Astro middleware?**

**Yes.** `@supabase/ssr` is designed to be framework-agnostic. In Astro middleware:

```typescript
// src/middleware.ts
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => parseCookieHeader(context.request.headers.get('Cookie') ?? ''),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  context.locals.supabase = supabase
  const { data: { user } } = await supabase.auth.getUser()
  context.locals.user = user
  return next()
})
```

The server client factory (`lib/supabase/server.ts`) needs a complete rewrite to accept `AstroCookies` instead of calling `cookies()` from `next/headers`. This is 30 lines of code.

**2. Will PKCE OAuth flow work in Astro? What changes are needed?**

**Yes.** PKCE is handled by the Supabase client library, not Next.js. The OAuth flow:
1. Client calls `supabase.auth.signInWithOAuth()` — no framework dependency
2. Browser redirects to Google → returns to `/auth/callback?code=...`
3. `/auth/callback` calls `supabase.auth.exchangeCodeForSession(code)` — framework-agnostic

Changes needed: Convert `/auth/callback` from a Next.js Route Handler to an Astro API route (`.ts` file in `src/pages/api/`). The logic is identical; only the request/response API changes (`NextRequest` → `Request`, `NextResponse.redirect` → `Response` or `return context.redirect()`).

**3. Can session refresh happen securely in Astro middleware?**

**Yes.** As shown in the middleware example above, `setAll` writes refreshed tokens to the response. Astro middleware has full access to both request cookies and response cookies.

**4. Are there any auth patterns that have NO direct Astro equivalent?**

**Server Actions called directly from React components.** This is the key architectural mismatch:

```typescript
// Current (Next.js Server Action — called directly)
import { createProduct } from '@/lib/actions/product'
const result = await createProduct(formData)  // works in client component

// Astro equivalent — must use fetch()
const response = await fetch('/api/products', { method: 'POST', body: formData })
const result = await response.json()
```

Server Actions are a Next.js-specific RPC mechanism. The mutation logic itself (validation, auth check, DB write) is portable — only the invocation mechanism changes.

**5. Will RLS in Supabase still protect data correctly after migration?**

**Yes, unconditionally.** RLS is enforced by Postgres on the Supabase side, independent of the application framework. The client library (using the anon key + user JWT) sends the same auth headers regardless of whether the calling code runs in Next.js or Astro. RLS policies remain unchanged.

**6. Are there any current security issues in the Next.js implementation that should be fixed regardless of migration?**

| Issue | Severity | Fix |
|---|---|---|
| `typescript: { ignoreBuildErrors: true }` in next.config.mjs | Medium | Remove before any migration — type errors in server actions could mask auth bypasses |
| Bug B2: `BlockedStoreScreen` broken template literal for support email | Low | Fix `{store.name}` interpolation |
| Bug M1/M2: Analytics `trackEvent()` never called from storefront | Low | Add `void trackEvent(...)` to store/product pages (already done in `app/s/[storeSlug]/page.tsx` and product page — may be partially fixed) |
| `/auth/confirm` does not validate `next` redirect param (unlike `/auth/callback`) | Low | Add same validation as `/auth/callback` to prevent open redirect |

---

### C. What WILL Work in Astro (No Changes Needed)

1. **All business logic in `lib/actions/*.ts`** — The validation (Zod), DB operations (Supabase), and auth checks (`getUser`, `isAdminUser`) are pure TypeScript with no framework coupling. The logic ports verbatim; only the invocation layer changes.
2. **`lib/validations.ts`** — Pure Zod + utility functions. Zero framework dependencies.
3. **`lib/constants.ts`** — Pure constants. No changes.
4. **`lib/queries.ts`** — Read-only Supabase queries. Will work once the server client factory is rewritten.
5. **`lib/supabase/roles.ts`** — Pure function checking `app_metadata`. No changes.
6. **`lib/cloudinary.ts` (browser)** — Calls `fetch('/api/cloudinary/sign')`. Works in any framework.
7. **All 23 "use client" components** — Work unchanged as React islands via `@astrojs/react`.
8. **All `components/ui/*`** — Radix + shadcn components. Work in React islands.
9. **Cloudinary signed upload flow** — Framework-agnostic. Server-side signature generation migrates to an Astro API route.
10. **WhatsApp deep link generation** — Pure string manipulation. No changes.
11. **Storefront theming** (`[data-theme]` + CSS custom properties) — Already CSS-based, framework-independent.
12. **`@supabase/ssr` library** — The library itself stays; only the cookie adaptor code changes.
13. **Supabase RLS policies** — Unchanged. Database-level enforcement.
14. **All environment variables** — Same keys, prefix `PUBLIC_` instead of `NEXT_PUBLIC_` for public vars.

---

### D. What Needs SIGNIFICANT Rework

**1. Server Actions → Astro API Routes (High effort)**

Every `lib/actions/*.ts` function that client components currently call as a direct import must become an HTTP endpoint. This affects ~20 exported functions across 5 files.

What changes:
- Create `src/pages/api/products.ts`, `src/pages/api/stores.ts`, etc.
- Move action logic into API route handlers
- All client components that import server actions must switch to `fetch()` calls
- Error handling changes from `ActionResult<T>` return type to HTTP status codes + JSON bodies
- `revalidatePath()` calls can be dropped entirely (Astro SSR fetches fresh data per request)

**2. Supabase Server Client Factory (Medium effort)**

`lib/supabase/server.ts` calls `cookies()` from `next/headers`. This must be rewritten to accept Astro's cookie API.

Options:
- Accept `AstroCookies` as a parameter: `createClient(cookies: AstroCookies)`
- Use the Astro middleware to inject a pre-configured client into `Astro.locals.supabase`
- The second approach is cleaner and requires no signature changes to query functions

**3. Server Components → .astro Pages (Medium-High effort)**

All dashboard/admin server components (10+ pages) fetch data at the top of the component. In Astro, this moves to frontmatter:

```astro
---
// dashboard/index.astro (equivalent of dashboard/page.tsx)
const { locals: { supabase, user } } = Astro
if (!user) return Astro.redirect('/auth/login')
const { data: store } = await supabase.from('stores').select('*').eq('owner_id', user.id).single()
---
<DashboardLayout store={store} userEmail={user.email}>
  <!-- content -->
</DashboardLayout>
```

The page logic ports almost line-for-line. Volume is the challenge (~15 pages).

**4. `useRouter` and `usePathname` from `next/navigation` (Medium effort)**

Used in:
- `ProductForm` and `StoreSettingsForm`: `useRouter().push()` after successful mutation
- `DashboardSidebar` and `AdminSidebar`: `usePathname()` for active link detection

Replacements:
- `useRouter().push()` → `window.location.href = path` (already used elsewhere in the codebase for logout) or use `navigate()` from `astro:transitions/client`
- `usePathname()` → Pass current path as a prop from the parent `.astro` file via `Astro.url.pathname`

**5. `generateMetadata` → Astro Head Slots (Low-Medium effort)**

Store layout and product page use async `generateMetadata`. In Astro, this becomes frontmatter variables passed to a `<head>` slot or an SEO component. Functionality is equivalent; it's a syntax change.

**6. `loading.tsx` → Astro View Transitions / Client Loading States (Medium effort)**

Five `loading.tsx` files provide suspense fallbacks for route-level loading. In Astro:
- View Transitions API (`@astrojs/transitions`) provides page transition effects
- Loading states for data within React islands are handled by the React component itself
- No direct equivalent for route-level suspense — each page loads fully before rendering

---

### E. What CANNOT Migrate to Astro

**Strictly speaking, nothing is impossible.** However, these features have no direct Astro equivalent and require architectural changes:

**1. Next.js Server Actions (RPC pattern)**

Server Actions let client components call server functions as if they're async functions — no HTTP plumbing visible. Astro has no equivalent. You must add HTTP indirection. This is a real architectural shift, not just a syntax change.

**2. `revalidatePath` / On-demand ISR**

`revalidatePath()` invalidates Next.js cache entries. Astro has no server-side cache to invalidate (SSR is always fresh). This means `revalidatePath()` calls simply disappear in migration — which is actually simpler, not harder. The tradeoff is that Astro SSR may be slightly slower than Next.js cached RSC for high-traffic pages, but for this app's scale (small sellers, low traffic) this is irrelevant.

**3. `next/font` font optimization**

`next/font/google` downloads fonts at build time and inlines them. Astro's equivalent would be `fontsource` npm packages or standard Google Fonts CSS `@import`. Functionally equivalent, just a build pipeline difference.

---

### F. React Library Compatibility

| Library | Works in Astro (React Island) | Astro-native Alt | Recommendation |
|---|---|---|---|
| `@radix-ui/*` (all 25) | ✅ Yes, unchanged | No | Keep via `@astrojs/react` |
| `react-hook-form` | ✅ Yes | No | Keep in form islands |
| `react-easy-crop` | ✅ Yes | No | Keep |
| `react-day-picker` | ✅ Yes | No | Keep |
| `recharts` | ✅ Yes | No | Keep |
| `vaul` | ✅ Yes | No | Keep |
| `embla-carousel-react` | ✅ Yes | `@astrojs/embla` unofficial | Keep react version |
| `cmdk` | ✅ Yes | No | Keep |
| `next-themes` | ⚠️ Partial | CSS `[data-theme]` | The app already uses CSS custom properties — finish removing `next-themes` |
| `@vercel/analytics` | ✅ `@vercel/analytics/astro` exists | Same | Use Astro integration |
| `lucide-react` | ✅ Yes | `lucide` (any framework) | Keep |
| `sonner` | ✅ Yes | No | Keep |
| `input-otp` | ✅ Yes | No | Keep |
| `zod` | ✅ (not framework-specific) | Same | No change |
| `date-fns` | ✅ (not framework-specific) | Same | No change |
| `class-variance-authority` | ✅ (not framework-specific) | Same | No change |

**All React UI libraries work in Astro React islands.** The only genuine incompatibility is `next-themes` (Next.js API surface), which is already de facto unused in this codebase.

---

### G. Overall Migration Verdict

## ⚠️ CONDITIONAL — Possible but requires significant rework

**Conditions for migration:**

1. **Server Actions must be converted to API routes.** This is the largest single body of work (~20 functions across 5 files). The logic is portable; the call sites are not.

2. **Supabase server client must be rewritten** (30 lines) to use Astro cookie API instead of `next/headers`.

3. **The dashboard is nearly 100% React.** With `@astrojs/react`, all client components work as islands. But every `.astro` page in the dashboard is essentially a thin data-fetching wrapper around a React island. The practical difference from "Next.js with RSC" is minimal — you're paying the migration cost for limited architectural gain in this zone.

**Estimated effort (solo dev):**
- Storefront (`/s/*`) only: **3–5 days** (clean, nearly pure SSR, no Server Actions)
- Full migration (all zones): **4–6 weeks**
  - Auth middleware + Supabase client rewrite: 2 days
  - API route conversion (server actions): 1 week
  - Page conversion (15 pages): 1 week
  - Client component updates (useRouter, usePathname): 3 days
  - Testing + debugging: 1 week

**Biggest single risk:**

The mutation layer. Server Actions are called directly from 15+ client component files. Converting to `fetch()` calls requires touching every callsite, updating error handling, and adding HTTP endpoints. A missed callsite breaks silently (TypeScript won't catch it if types are loose). The risk is not that it's technically hard — it's that the surface area is large and testing is manual (no test suite exists).

---

### H. If Migration is Recommended — Step-by-Step Plan

> **Recommended approach: Partial migration first.** Migrate the public storefront (`/s/*`) to Astro. Keep the dashboard and admin panel in Next.js. Then evaluate full migration after validating Astro in production.

#### Phase A — Monorepo Setup (Week 1)

1. Create Astro project in `/apps/storefront/` (or keep Next.js app, add Astro as separate project)
2. Install integrations: `@astrojs/react`, `@astrojs/tailwind`, `@astrojs/vercel`, `@supabase/ssr`
3. Share lib code via a `packages/` workspace: `packages/lib/` containing `validations.ts`, `constants.ts`, `types/`, `supabase/roles.ts`
4. Configure `pnpm workspaces` in root `package.json`

#### Phase B — Astro Auth Middleware (Week 1)

Convert `lib/supabase/middleware.ts` to Astro middleware:
```
src/middleware.ts (Astro) ≈ lib/supabase/middleware.ts (Next.js)
```
Key changes:
- `NextRequest` → `APIContext`
- `NextResponse.redirect()` → `return context.redirect()`
- `request.cookies.getAll()` → `parseCookieHeader(request.headers.get('Cookie'))`
- `supabaseResponse.cookies.set()` → `context.cookies.set()`
- Set `context.locals.user` and `context.locals.supabase` for downstream use

Test: Unauthenticated requests to `/dashboard` redirect to `/auth/login`. Authenticated requests pass through.

#### Phase C — Supabase Server Client Rewrite (Week 1)

```typescript
// New: lib/supabase/server.ts (Astro-compatible)
import { createServerClient } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

export function createClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookies.headers(), // or parse from request
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookies.set(name, value, options))
      }
    }
  )
}
```

Alternatively, use `context.locals.supabase` set by middleware — no factory function needed.

Test: `supabase.auth.getUser()` returns correct user in `.astro` frontmatter.

#### Phase D — Public Storefront Migration (Week 2)

Migrate these routes in order (lowest risk first):
1. `/s/[storeSlug]` — store homepage (pure SSR, no auth, no mutations)
2. `/s/[storeSlug]/[productSlug]` — product page
3. `/s/[storeSlug]/products` — products listing
4. Store layout with theme system

For each page:
- Convert `async function Page({ params })` → Astro frontmatter with `const { storeSlug } = Astro.params`
- Convert `notFound()` → `return new Response(null, { status: 404 })`
- Convert `<Image ...>` → `<img ...>` (already unoptimized in Next.js)
- Convert `<Link href="...">` → `<a href="...">`
- Keep React islands for interactive components (`WhatsAppButton`, `ImageGallery`)
- Drop `trackEvent()` server calls — replace with Astro API routes or keep as server actions converted to API routes

`WhatsAppButton` calls `trackWhatsAppClick` (a server action). In Astro, convert `lib/actions/analytics.ts::trackWhatsAppClick` to a `POST /api/analytics/track` endpoint.

#### Phase E — Auth Routes (Week 2)

Convert API routes:
- `/auth/callback` → `src/pages/api/auth/callback.ts`
- `/auth/confirm` → `src/pages/api/auth/confirm.ts`

These are nearly line-for-line ports; only the request/response API changes:
- `request.url` → `context.url` (same)
- `NextResponse.redirect(url)` → `return context.redirect(url)` or `return Response.redirect(url, 302)`
- `createClient()` → `createClient(context.cookies)` or use middleware-injected client

#### Phase F — Convert Server Actions to API Routes (Weeks 3–4, if doing full migration)

For each action file, create a corresponding API route:

```
lib/actions/product.ts → src/pages/api/products/[action].ts
lib/actions/store.ts   → src/pages/api/stores/[action].ts
lib/actions/admin.ts   → src/pages/api/admin/[action].ts
lib/actions/category.ts → src/pages/api/categories/[action].ts
lib/actions/analytics.ts → src/pages/api/analytics/track.ts
```

Each API route:
1. Reads body (JSON or FormData)
2. Calls the same validation + auth + DB logic (now as plain functions, not "use server")
3. Returns `Response.json({ success, error, data })`

Update all client components to use `fetch()` instead of direct function imports:
```typescript
// Before (Server Action)
import { createProduct } from '@/lib/actions/product'
const result = await createProduct(formData)

// After (API route)
const result = await fetch('/api/products/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
}).then(r => r.json())
```

Remove all `revalidatePath()` calls — not needed in Astro SSR.

#### Phase G — Dashboard Page Migration (Week 4)

Convert server component pages to `.astro` files:

```astro
---
// src/pages/dashboard/index.astro
const { locals: { supabase, user } } = Astro
if (!user) return Astro.redirect('/auth/login')

const { data: store } = await supabase.from('stores').select('*').eq('owner_id', user.id).single()
const { data: products } = store 
  ? await supabase.from('products').select('*').eq('store_id', store.id)
  : { data: [] }
---
<DashboardLayout store={store} userEmail={user.email}>
  <DashboardOverview client:load store={store} products={products} />
</DashboardLayout>
```

#### Phase H — Fix next/navigation Dependencies in React Islands (Week 4–5)

**`useRouter().push(path)`** in ProductForm and StoreSettingsForm:
```typescript
// Replace with:
window.location.href = path  // already used for logout — consistent
// Or: import { navigate } from 'astro:transitions/client'; navigate(path)
```

**`usePathname()`** in DashboardSidebar and AdminSidebar:
```astro
// In parent .astro file:
<DashboardSidebar client:load currentPath={Astro.url.pathname} />
```
```typescript
// In React component: receive as prop instead of hook
function DashboardSidebar({ currentPath }: { currentPath: string }) {
  // use currentPath instead of usePathname()
}
```

#### Phase I — Final Steps

1. Replace `next/font/google` with `fontsource` packages or Google Fonts CSS link:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Geist&display=swap" rel="stylesheet">
   ```
2. Replace `@vercel/analytics` import with `@vercel/analytics/astro`:
   ```astro
   import { Analytics } from '@vercel/analytics/astro'
   ```
3. Configure `@astrojs/vercel` adapter for deployment
4. Update environment variable prefix: `NEXT_PUBLIC_*` → `PUBLIC_*` (Astro convention)

#### Recommended Astro Integrations

```bash
pnpm astro add react      # @astrojs/react — for all client components
pnpm astro add tailwind   # @astrojs/tailwind — already using Tailwind v4
pnpm astro add vercel     # @astrojs/vercel — for Vercel SSR deployment
```

Additional packages:
```bash
pnpm add @supabase/ssr    # same version, different cookie adaptor
pnpm add @vercel/analytics # use /astro import path
```

#### What to test at each stage

| Stage | Test |
|---|---|
| Auth middleware | Unauthenticated → redirected; authenticated → passes; admin vs seller routing |
| Supabase client | `getUser()` returns correct user; session persists across requests |
| Store pages | Stores render at `/s/[slug]`; blocked stores show unavailable; themes apply |
| Product pages | OG metadata correct; WhatsApp link correct; analytics event fires |
| Auth flows | Login, signup, Google OAuth, password reset all complete end-to-end |
| API routes | Cloudinary sign endpoint returns valid signature; upload succeeds |
| Dashboard | All CRUD operations work; mutations update UI; blocked store shows screen |
| Admin panel | Only admins can access; all store management actions work |

---

## Summary

| Zone | Migration Path | Effort | Recommendation |
|---|---|---|---|
| Public storefront `/s/*` | Clean migration to Astro | 3–5 days | ✅ Do it now |
| Auth routes `/auth/*` | Port to Astro API routes | 1–2 days | ✅ Do it with storefront |
| Dashboard `/dashboard/*` | Astro shell + React islands | 2–3 weeks | ⚠️ Only if full migration justified |
| Admin panel `/admin/*` | Astro shell + React islands | 1–2 weeks | ⚠️ Only if full migration justified |
| API routes | Port to Astro API routes | 2–3 days | ✅ Required for any migration |
| Server Actions | Convert to API routes + fetch | 1–2 weeks | ⚠️ Largest effort, required for dashboard |

**Final recommendation:** Migrate the public storefront to Astro first. It's pure SSR, no Server Actions, no mutations, and directly benefits from Astro's performance story (zero JS by default for storefront visitors). The dashboard and admin panel are deeply React and benefit less from Astro — keep them in Next.js unless there's a strong reason to unify the stack.
