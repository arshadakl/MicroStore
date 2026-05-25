# MicroStore → Astro Migration Plan

**Goal:** Migrate storefront, seller dashboard, and auth to Astro on Cloudflare Pages.  
**Admin panel stays in Next.js on Vercel (untouched).**  
**Zero UI changes. Zero feature changes. Exact parity.**

---

## Architecture After Migration

```
┌─────────────────────────────────────────────────────┐
│  apps/admin  (Next.js — UNCHANGED, stays on Vercel) │
│  /admin/*                                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  apps/store  (Astro — NEW, on Cloudflare Pages)     │
│  /           landing page                           │
│  /auth/*     login, signup, forgot, reset, callback │
│  /dashboard/* seller dashboard                      │
│  /s/*        public storefront                      │
└─────────────────────────────────────────────────────┘

Both apps share same Supabase project and Cloudinary account.
```

---

## Monorepo Structure

```
MicroStore/                         ← existing repo root
├── apps/
│   ├── admin/                      ← MOVE current Next.js here (trimmed to admin only)
│   └── store/                      ← NEW Astro project
├── packages/
│   └── shared/                     ← shared types, constants, validations
│       ├── constants.ts
│       ├── validations.ts
│       ├── types/index.ts
│       └── supabase/roles.ts
├── package.json                    ← pnpm workspace root
└── pnpm-workspace.yaml
```

---

## Astro Project File Structure

```
apps/store/
├── src/
│   ├── middleware.ts                ← auth session refresh + route protection
│   ├── env.d.ts                    ← type Astro.locals
│   │
│   ├── pages/
│   │   ├── index.astro             ← landing page
│   │   │
│   │   ├── auth/
│   │   │   ├── login.astro
│   │   │   ├── sign-up.astro
│   │   │   ├── forgot-password.astro
│   │   │   ├── reset-password.astro
│   │   │   └── error.astro
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── callback.ts     ← OAuth + OTP handler
│   │   │   │   └── confirm.ts      ← email OTP confirm
│   │   │   ├── cloudinary/
│   │   │   │   └── sign.ts         ← signed upload token
│   │   │   ├── products/
│   │   │   │   ├── create.ts
│   │   │   │   ├── update.ts
│   │   │   │   ├── delete.ts
│   │   │   │   ├── toggle-active.ts
│   │   │   │   └── toggle-featured.ts
│   │   │   ├── stores/
│   │   │   │   ├── create.ts
│   │   │   │   └── update.ts
│   │   │   ├── categories/
│   │   │   │   ├── create.ts
│   │   │   │   ├── update.ts
│   │   │   │   └── delete.ts
│   │   │   └── analytics/
│   │   │       └── track.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── index.astro         ← overview
│   │   │   ├── products/
│   │   │   │   ├── index.astro
│   │   │   │   ├── new.astro
│   │   │   │   └── [id]/
│   │   │   │       └── edit.astro
│   │   │   ├── categories.astro
│   │   │   ├── analytics.astro
│   │   │   └── settings.astro
│   │   │
│   │   └── s/
│   │       └── [storeSlug]/
│   │           ├── index.astro
│   │           ├── products.astro
│   │           └── [productSlug].astro
│   │
│   ├── layouts/
│   │   ├── RootLayout.astro
│   │   ├── DashboardLayout.astro
│   │   └── StoreLayout.astro
│   │
│   ├── components/
│   │   ├── auth/                   ← COPY from Next.js, minor edits
│   │   │   └── GoogleAuthButton.tsx
│   │   ├── dashboard/              ← COPY from Next.js, update imports + hooks
│   │   │   ├── DashboardSidebar.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductListTable.tsx
│   │   │   ├── StoreSettingsForm.tsx
│   │   │   ├── CategoryManager.tsx
│   │   │   ├── OnboardingModal.tsx
│   │   │   ├── StoreOnboarding.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── CropModal.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   ├── TrialBanner.tsx
│   │   │   └── BlockedStoreScreen.tsx
│   │   ├── store/                  ← COPY unchanged
│   │   │   ├── ProductCard.tsx
│   │   │   ├── WhatsAppButton.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── StoreNavbar.tsx
│   │   │   └── StoreUnavailable.tsx
│   │   └── ui/                    ← COPY entirely unchanged
│   │
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts           ← COPY unchanged
│       │   ├── server.ts           ← REWRITE (Astro cookies)
│       │   ├── middleware.ts       ← REWRITE (Astro middleware)
│       │   └── roles.ts            ← COPY unchanged
│       ├── queries.ts              ← COPY unchanged
│       ├── constants.ts            ← COPY unchanged
│       ├── validations.ts          ← COPY unchanged
│       ├── utils.ts                ← COPY unchanged
│       ├── cloudinary.ts           ← COPY unchanged
│       ├── cloudinary-server.ts    ← COPY, update crypto import
│       ├── crop-image.ts           ← COPY unchanged
│       └── api.ts                  ← NEW: fetch helpers replacing server action imports
│
├── public/                         ← COPY all from Next.js public/
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── wrangler.toml
```

---

## Phase 1 — Project Setup

### 1.1 Create pnpm workspace

**`pnpm-workspace.yaml`** (repo root):
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Root `package.json`**:
```json
{
  "name": "microstore",
  "private": true,
  "scripts": {
    "dev:store": "pnpm --filter store dev",
    "dev:admin": "pnpm --filter admin dev",
    "build:store": "pnpm --filter store build",
    "build:admin": "pnpm --filter admin build"
  }
}
```

### 1.2 Move current Next.js app into apps/admin

```bash
# From repo root
mkdir -p apps/admin
# Move all Next.js files into apps/admin
# Remove dashboard/, auth/, s/, app/page.tsx (landing)
# Keep only app/admin/**, components/admin/**, lib/actions/admin.ts
```

### 1.3 Create Astro project

```bash
cd apps
pnpm create astro@latest store -- --template minimal --typescript strict --no-install
cd store
pnpm add @astrojs/react @astrojs/cloudflare @astrojs/tailwind
pnpm add react react-dom
pnpm add @supabase/ssr
pnpm add @vercel/analytics  # for /api/cloudinary calls, not Vercel — see note
```

### 1.4 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  vite: {
    resolve: {
      alias: { '@': '/src' },
    },
  },
})
```

### 1.5 `wrangler.toml`

```toml
name = "microstore-store"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]    # enables node:crypto for Cloudinary signing
```

### 1.6 `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('@supabase/supabase-js').SupabaseClient
    user: import('@supabase/supabase-js').User | null
  }
}
```

### 1.7 `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

### 1.8 Environment variables

Rename in `.env` (Astro uses `PUBLIC_` not `NEXT_PUBLIC_`):
```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
PUBLIC_APP_URL=https://your-domain.com

# Server-only (no PUBLIC_ prefix)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Phase 2 — Core Infrastructure

### 2.1 Supabase server client rewrite

**`src/lib/supabase/server.ts`** (replaces Next.js version):

```typescript
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

export function createClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookies.toString())
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, options as Parameters<AstroCookies['set']>[2])
          )
        },
      },
    }
  )
}
```

**`src/lib/supabase/client.ts`** — copy unchanged from Next.js:
```typescript
"use client"
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  )
}
```

### 2.2 Astro middleware

**`src/middleware.ts`** (rewrites `lib/supabase/middleware.ts` logic):

```typescript
import { defineMiddleware } from 'astro:middleware'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { isAdminUser } from '@/lib/supabase/roles'

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect, url } = context

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => parseCookieHeader(request.headers.get('Cookie') ?? ''),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Inject into locals for use in pages
  context.locals.supabase = supabase
  context.locals.user = user

  const pathname = url.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isAuth = pathname.startsWith('/auth')

  // Unauthenticated — protect dashboard
  if (!user && isDashboard) {
    return redirect('/auth/login')
  }

  // Authenticated — redirect away from auth pages (except callback + reset)
  if (user && isAuth && !pathname.startsWith('/auth/callback') && !pathname.startsWith('/auth/reset-password')) {
    return redirect('/dashboard')
  }

  // Dashboard — check store blocked status, set local flag
  if (user && isDashboard) {
    const { data: store } = await supabase
      .from('stores')
      .select('id, is_blocked, status')
      .eq('owner_id', user.id)
      .single()

    if (store?.is_blocked || store?.status === 'blocked') {
      context.locals.storeBlocked = true
    }
  }

  return next()
})
```

Add to `env.d.ts`:
```typescript
interface Locals {
  supabase: import('@supabase/supabase-js').SupabaseClient
  user: import('@supabase/supabase-js').User | null
  storeBlocked?: boolean
}
```

### 2.3 Cloudinary server — fix crypto for Cloudflare

**`src/lib/cloudinary-server.ts`** — replace `node:crypto` usage:

The original uses `createHash('sha1')` from `node:crypto`. With `nodejs_compat` flag in `wrangler.toml`, this imports directly:

```typescript
import { createHash } from 'node:crypto'  // works with nodejs_compat flag
```

No other changes needed. Copy the rest of the file as-is.

### 2.4 Shared lib files — copy unchanged

Copy these files directly, update only `process.env.XXX` → `import.meta.env.XXX`:

| File | Changes |
|---|---|
| `lib/constants.ts` | None |
| `lib/validations.ts` | None |
| `lib/queries.ts` | `process.env.NEXT_PUBLIC_APP_URL` → `import.meta.env.PUBLIC_APP_URL` |
| `lib/utils.ts` | None |
| `lib/cloudinary.ts` | None (uses `fetch`, no env vars) |
| `lib/crop-image.ts` | None |
| `types/index.ts` | None |
| `lib/supabase/roles.ts` | None |

### 2.5 API helper for client components

**`src/lib/api.ts`** — NEW file, replaces server action imports in client components:

```typescript
// Generic POST helper used by all client components
export async function apiPost<T = void>(
  endpoint: string,
  body: unknown
): Promise<{ success: boolean; error?: string; data?: T }> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok && res.status === 401) {
    window.location.href = '/auth/login'
    return { success: false, error: 'Not authenticated' }
  }
  return res.json()
}

export async function apiDelete(
  endpoint: string,
  body?: unknown
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}
```

---

## Phase 3 — API Routes (Server Actions → HTTP Endpoints)

Each server action becomes an Astro API route. The validation + auth + DB logic is identical — only the wrapper changes.

### 3.1 Auth guard helper

**`src/lib/api-guard.ts`**:

```typescript
import type { APIContext } from 'astro'

export function requireUser(context: APIContext) {
  const user = context.locals.user
  if (!user) {
    return {
      user: null,
      error: new Response(JSON.stringify({ success: false, error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }
  return { user, error: null }
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

### 3.2 Product API routes

**`src/pages/api/products/create.ts`**:
```typescript
import type { APIRoute } from 'astro'
import { requireUser, json } from '@/lib/api-guard'
import { productSchema, generateSlug, sanitizeString } from '@/lib/validations'
import { ERROR_MESSAGES, PRODUCT_LIMITS } from '@/lib/constants'

export const POST: APIRoute = async (context) => {
  const { user, error: authError } = requireUser(context)
  if (authError) return authError

  const body = await context.request.json()
  const validation = productSchema.safeParse(body)
  if (!validation.success) {
    return json({ success: false, error: validation.error.errors[0]?.message }, 400)
  }

  const supabase = context.locals.supabase

  // Get store
  const { data: store } = await supabase
    .from('stores')
    .select('id, status, is_blocked')
    .eq('owner_id', user!.id)
    .single()

  if (!store) return json({ success: false, error: ERROR_MESSAGES.STORE_NOT_FOUND }, 404)
  if (store.is_blocked || store.status === 'blocked' || store.status === 'paused') {
    return json({ success: false, error: ERROR_MESSAGES.STORE_BLOCKED }, 403)
  }

  // Enforce product limit
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id)

  const limit = store.status === 'active' ? PRODUCT_LIMITS.MAX_PRODUCTS_PAID : PRODUCT_LIMITS.MAX_PRODUCTS_FREE
  if ((count ?? 0) >= limit) {
    return json({ success: false, error: ERROR_MESSAGES.PRODUCT_LIMIT_REACHED }, 400)
  }

  // Verify category ownership
  if (validation.data.categoryId) {
    const { data: cat } = await supabase
      .from('categories').select('id').eq('id', validation.data.categoryId).eq('store_id', store.id).single()
    if (!cat) return json({ success: false, error: ERROR_MESSAGES.UNAUTHORIZED }, 403)
  }

  // Generate unique slug
  let slug = generateSlug(validation.data.title)
  let suffix = 0
  while (true) {
    const check = suffix > 0 ? `${slug}-${suffix}` : slug
    const { data: existing } = await supabase.from('products').select('id').eq('store_id', store.id).eq('slug', check).single()
    if (!existing) { slug = check; break }
    suffix++
  }

  const { data: product, error: createError } = await supabase
    .from('products')
    .insert({
      store_id: store.id,
      category_id: validation.data.categoryId ?? null,
      title: sanitizeString(validation.data.title),
      slug,
      description: validation.data.description ? sanitizeString(validation.data.description) : null,
      price: validation.data.price,
      images: validation.data.images || [],
      is_featured: validation.data.isFeatured,
      is_active: validation.data.isActive,
    })
    .select('id, slug')
    .single()

  if (createError || !product) return json({ success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR }, 500)

  return json({ success: true, data: { productId: product.id, slug: product.slug } })
}
```

**`src/pages/api/products/update.ts`** — same pattern, receives `{ productId, ...data }` in body.

**`src/pages/api/products/delete.ts`** — DELETE method, receives `{ productId }`.

**`src/pages/api/products/toggle-active.ts`** — POST, receives `{ productId, isActive }`.

**`src/pages/api/products/toggle-featured.ts`** — POST, receives `{ productId, isFeatured }`.

### 3.3 Store API routes

**`src/pages/api/stores/create.ts`** — mirrors `createStore` action exactly.

**`src/pages/api/stores/update.ts`** — mirrors `updateStore` action exactly.

### 3.4 Category API routes

**`src/pages/api/categories/create.ts`** — mirrors `createCategory`.  
**`src/pages/api/categories/update.ts`** — mirrors `updateCategory`.  
**`src/pages/api/categories/delete.ts`** — mirrors `deleteCategory`.

### 3.5 Analytics API route

**`src/pages/api/analytics/track.ts`**:
```typescript
import type { APIRoute } from 'astro'
import { json } from '@/lib/api-guard'

export const POST: APIRoute = async (context) => {
  const { storeId, productId } = await context.request.json()
  if (!storeId || !productId) return json({ success: false }, 400)

  const supabase = context.locals.supabase
  await supabase.from('analytics_events').insert({
    store_id: storeId,
    product_id: productId,
    event_type: 'click_whatsapp',
  })

  return json({ success: true })
}
```

### 3.6 Cloudinary sign route

**`src/pages/api/cloudinary/sign.ts`**:
```typescript
import type { APIRoute } from 'astro'
import { createHash } from 'node:crypto'
import { requireUser, json } from '@/lib/api-guard'
import { CLOUDINARY_UPLOAD_LIMITS } from '@/lib/constants'

function buildSignature(params: Record<string, string | number>, secret: string): string {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
  return createHash('sha1').update(str + secret).digest('hex')
}

export const POST: APIRoute = async (context) => {
  const { user, error: authError } = requireUser(context)
  if (authError) return authError

  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME
  const apiKey = import.meta.env.CLOUDINARY_API_KEY
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: 'Upload service not configured' }, 503)
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `microstore/${user!.id}`
  const paramsToSign = { folder, timestamp }
  const signature = buildSignature(paramsToSign, apiSecret)

  return json({ signature, timestamp, api_key: apiKey, cloud_name: cloudName, folder })
}
```

### 3.7 Auth API routes

**`src/pages/api/auth/callback.ts`**:
```typescript
import type { APIRoute } from 'astro'

export const GET: APIRoute = async (context) => {
  const { url, redirect, locals } = context
  const { searchParams, origin } = url

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'
  const callbackError = searchParams.get('error')

  if (callbackError) {
    const errorUrl = new URL('/auth/error', origin)
    errorUrl.searchParams.set('error', callbackError)
    const desc = searchParams.get('error_description')
    if (desc) errorUrl.searchParams.set('message', desc)
    return redirect(errorUrl.toString())
  }

  const supabase = locals.supabase

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as any, token_hash: tokenHash })
    if (!error) return redirect(`${origin}${next}`)
    const errorUrl = new URL('/auth/error', origin)
    errorUrl.searchParams.set('error', error.code ?? 'verify_failed')
    errorUrl.searchParams.set('message', error.message)
    return redirect(errorUrl.toString())
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return redirect(`${origin}${next}`)
    const errorUrl = new URL('/auth/error', origin)
    errorUrl.searchParams.set('error', error.code ?? 'exchange_failed')
    errorUrl.searchParams.set('message', error.message)
    return redirect(errorUrl.toString())
  }

  const errorUrl = new URL('/auth/error', origin)
  errorUrl.searchParams.set('error', 'missing_code')
  errorUrl.searchParams.set('message', 'Verification link is invalid or incomplete.')
  return redirect(errorUrl.toString())
}
```

**`src/pages/api/auth/confirm.ts`** — same pattern, handles `token_hash` only (no `code`). Also add `next` param validation (currently missing in Next.js version — security fix).

---

## Phase 4 — Layouts

### 4.1 Root layout

**`src/layouts/RootLayout.astro`**:
```astro
---
export interface Props {
  title?: string
  description?: string
}
const { title = 'MicroStore', description = 'WhatsApp-First Store for Instagram Sellers' } = Astro.props
---
<!DOCTYPE html>
<html lang="en" class="bg-background">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <!-- Geist font via fontsource -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="icon" href="/icon-light-32x32.png" media="(prefers-color-scheme: light)" />
    <link rel="icon" href="/icon-dark-32x32.png" media="(prefers-color-scheme: dark)" />
    <link rel="apple-touch-icon" href="/apple-icon.png" />
  </head>
  <body class="font-sans antialiased">
    <slot />
  </body>
</html>
```

Note: Replace `next/font` with Google Fonts `<link>`. Geist is available directly at `fonts.googleapis.com/css2?family=Geist`.  
Alternative: `pnpm add @fontsource/geist` → `import '@fontsource/geist'` in layout.

### 4.2 Dashboard layout

**`src/layouts/DashboardLayout.astro`**:
```astro
---
import type { Store } from '@/lib/types'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { BlockedStoreScreen } from '@/components/dashboard/BlockedStoreScreen'
import RootLayout from './RootLayout.astro'

export interface Props {
  store: Store | null
  userEmail: string
  productCount?: number
}

const { store, userEmail, productCount } = Astro.props
const storeBlocked = Astro.locals.storeBlocked
---
<RootLayout>
  {storeBlocked && store ? (
    <BlockedStoreScreen client:load store={store} />
  ) : (
    <div class="flex min-h-screen bg-background">
      <DashboardSidebar
        client:load
        store={store}
        userEmail={userEmail}
        productCount={productCount ?? 0}
        currentPath={Astro.url.pathname}
      />
      <div class="flex-1 flex flex-col overflow-auto pt-14 md:pt-0">
        {store && <TrialBanner client:load store={store} />}
        <main class="flex-1">
          <slot />
        </main>
      </div>
    </div>
  )}
</RootLayout>
```

### 4.3 Store layout

**`src/layouts/StoreLayout.astro`**:
```astro
---
import type { Store } from '@/lib/types'
import { StoreNavbar } from '@/components/store/StoreNavbar'
import { StoreUnavailable } from '@/components/store/StoreUnavailable'
import RootLayout from './RootLayout.astro'

export interface Props {
  store: Store
  title?: string
  description?: string
  ogImage?: string
}

const { store, title, description, ogImage } = Astro.props
const theme = store.theme_id || 'minimal'
---
<RootLayout title={title} description={description}>
  <div
    class="min-h-screen storefront-theme"
    data-theme={theme}
    style={`background-color: var(--store-bg); color: var(--store-text);`}
  >
    <StoreNavbar client:load store={store} theme={theme} />
    <slot />
  </div>
</RootLayout>
```

---

## Phase 5 — Pages

### 5.1 Landing page

**`src/pages/index.astro`**:
```astro
---
import RootLayout from '@/layouts/RootLayout.astro'
---
<RootLayout title="MicroStore — WhatsApp-First Store for Instagram Sellers">
  <!-- PASTE entire JSX from app/page.tsx here, converting: -->
  <!-- <Link href="..."> → <a href="..."> -->
  <!-- className → class -->
  <!-- React fragments <> → nothing needed in Astro -->
  <!-- import { ROUTES } from already available via lib/constants -->
</RootLayout>
```

Full landing page content is identical. Just JSX → Astro HTML (rename `className` to `class`, `<Link>` to `<a>`).

### 5.2 Auth pages (client-rendered, React islands)

**`src/pages/auth/login.astro`**:
```astro
---
import RootLayout from '@/layouts/RootLayout.astro'
import LoginPage from '@/components/auth/LoginPage'
---
<RootLayout title="Sign in — MicroStore">
  <LoginPage client:load />
</RootLayout>
```

Extract the JSX from `app/auth/login/page.tsx` into `src/components/auth/LoginPage.tsx` — keep all the `useState`, `useForm`, `GoogleAuthButton`, Supabase client calls. Zero changes to the logic.

Same pattern for: `sign-up.astro`, `forgot-password.astro`, `reset-password.astro`, `error.astro`.

### 5.3 Dashboard pages

**`src/pages/dashboard/index.astro`**:
```astro
---
import DashboardLayout from '@/layouts/DashboardLayout.astro'
import { OnboardingModal } from '@/components/dashboard/OnboardingModal'
import { CopyButton } from '@/components/dashboard/CopyButton'
// ... other imports

const { supabase, user } = Astro.locals
if (!user) return Astro.redirect('/auth/login')

const { data: store } = await supabase.from('stores').select('*').eq('owner_id', user.id).single()
const { data: products } = store
  ? await supabase.from('products').select('*').eq('store_id', store.id)
  : { data: [] }

if (!store) {
  // Show onboarding
}

const totalProducts = products?.length ?? 0
const featuredCount = products?.filter(p => p.is_featured).length ?? 0
const activeCount = products?.filter(p => p.is_active).length ?? 0
const storeUrl = `${import.meta.env.PUBLIC_APP_URL}/s/${store?.slug}`
---
<DashboardLayout store={store} userEmail={user.email ?? ''} productCount={totalProducts}>
  {!store ? (
    <OnboardingModal client:load />
  ) : (
    <!-- Paste exact dashboard JSX, className → class, Link → a -->
    <!-- CopyButton stays as React island: <CopyButton client:load text={storeUrl} /> -->
  )}
</DashboardLayout>
```

**`src/pages/dashboard/products/index.astro`**:
```astro
---
const { supabase, user } = Astro.locals
if (!user) return Astro.redirect('/auth/login')

const { data: store } = await supabase.from('stores').select('*').eq('owner_id', user.id).single()
if (!store) return Astro.redirect('/dashboard')

const [{ data: products }, categories] = await Promise.all([
  supabase.from('products').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
  getCategoriesByStoreId(store.id),
])
---
<DashboardLayout store={store} userEmail={user.email ?? ''} productCount={products?.length ?? 0}>
  <div class="px-4 py-6 sm:p-8 max-w-4xl mx-auto space-y-6">
    <div class="flex flex-wrap items-start gap-3 justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Products</h1>
        <p class="text-muted-foreground text-sm mt-0.5">Manage your product catalogue</p>
      </div>
      <a href="/dashboard/products/new" class="...">Add product</a>
    </div>
    <ProductListTable client:load products={products ?? []} storeSlug={store.slug} categories={categories} />
  </div>
</DashboardLayout>
```

Follow same pattern for all other dashboard pages:

| Next.js page | Astro page | Notes |
|---|---|---|
| `dashboard/products/new/page.tsx` | `dashboard/products/new.astro` | `<ProductForm client:load categories={categories} />` |
| `dashboard/products/[id]/edit/page.tsx` | `dashboard/products/[id]/edit.astro` | `Astro.params.id` |
| `dashboard/categories/page.tsx` | `dashboard/categories.astro` | `<CategoryManager client:load categories={categories} />` |
| `dashboard/analytics/page.tsx` | `dashboard/analytics.astro` | Pure server render, no React islands needed |
| `dashboard/settings/page.tsx` | `dashboard/settings.astro` | `<StoreSettingsForm client:load store={store} />` |

### 5.4 Storefront pages

**`src/pages/s/[storeSlug]/index.astro`**:
```astro
---
import StoreLayout from '@/layouts/StoreLayout.astro'
import { ProductCard } from '@/components/store/ProductCard'
import { getCategoriesByStoreId } from '@/lib/queries'

const { storeSlug } = Astro.params
const { supabase } = Astro.locals

const { data: store } = await supabase.from('stores').select('*').eq('slug', storeSlug).single()
if (!store) return new Response(null, { status: 404 })

if (store.is_blocked || store.status === 'blocked' || store.status === 'paused') {
  return Astro.redirect(`/s/${storeSlug}/unavailable`)  // or render inline
}

// Fire analytics (non-blocking)
supabase.from('analytics_events').insert({ store_id: store.id, event_type: 'view' })

const [categories, { data: allProducts }] = await Promise.all([
  getCategoriesByStoreId(store.id),
  supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true).order('created_at', { ascending: false }),
])
---
<StoreLayout
  store={store}
  title={store.name}
  description={store.tagline ?? `Shop at ${store.name}`}
  ogImage={store.banner_url ?? store.logo_url}
>
  <main>
    {store.banner_url && (
      <div class="relative w-full h-48 sm:h-64 overflow-hidden">
        <img src={store.banner_url} alt={`${store.name} banner`} class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-black/20" />
      </div>
    )}
    <!-- Rest of store JSX, identical content, className → class, Image → img -->
    <!-- ProductCard stays as React island: <ProductCard client:load product={p} storeSlug={store.slug} /> -->
  </main>
</StoreLayout>
```

**`src/pages/s/[storeSlug]/[productSlug].astro`**:
```astro
---
const { storeSlug, productSlug } = Astro.params
// ... fetch store + product
// product page is mostly static — only WhatsAppButton needs client:load

const productUrl = `${import.meta.env.PUBLIC_APP_URL}/s/${storeSlug}/${productSlug}`
---
<StoreLayout store={store} title={`${product.title} — ${store.name}`} ...>
  <main class="max-w-4xl mx-auto px-4 py-10">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
      <ImageGallery client:load images={product.images ?? []} title={product.title} />
      <div class="space-y-6">
        <!-- price, title, description — pure HTML -->
        <WhatsAppButton
          client:load
          phone={store.whatsapp_number}
          productTitle={product.title}
          price={Number(product.price)}
          productUrl={productUrl}
          storeId={store.id}
          productId={product.id}
        />
      </div>
    </div>
  </main>
</StoreLayout>
```

**`src/pages/s/[storeSlug]/products.astro`** — identical port of `app/s/[storeSlug]/products/page.tsx`.  
`searchParams` → `Astro.url.searchParams.get('category')`.

---

## Phase 6 — Client Component Updates

These components need code changes (not just copy). All logic stays identical.

### 6.1 `DashboardSidebar.tsx` — remove `usePathname`

```typescript
// BEFORE (Next.js)
import { usePathname } from 'next/navigation'
const pathname = usePathname()

// AFTER (Astro)
// Accept as prop — set in DashboardLayout from Astro.url.pathname
interface DashboardSidebarProps {
  store: Store | null
  userEmail: string
  productCount?: number
  currentPath: string  // ← ADD
}

function SidebarInner({ ..., currentPath }: ...) {
  // Replace usePathname() with currentPath prop
  const isActive = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href))
}
```

Also: `import Link from 'next/link'` → `// remove Link import` — `Link` component used in sidebar is already a plain `<a>` wrapper functionally. Since sidebar is a React island, you can keep using `<a href>` directly or keep `Link` if you import from a React Router equivalent. Simplest: just use `<a href="...">` — the sidebar doesn't need SPA navigation.

### 6.2 `AdminSidebar.tsx` — same fix as DashboardSidebar

Same `usePathname` → prop pattern. But wait — AdminSidebar stays in the Next.js admin project. No change needed here.

### 6.3 `ProductForm.tsx` — remove `useRouter`, replace server action imports

```typescript
// BEFORE
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/lib/actions/product'
import Link from 'next/link'

const router = useRouter()

async function onSubmit(data) {
  const result = await createProduct(data)
  if (result.success) router.push('/dashboard/products')
}

// AFTER
import { apiPost } from '@/lib/api'

// Remove router, remove Link import
async function onSubmit(data) {
  const result = await apiPost('/api/products/create', data)
  if (result.success) window.location.href = '/dashboard/products'
}

// For edit:
async function onSubmit(data) {
  const result = await apiPost('/api/products/update', { productId: product.id, ...data })
  if (result.success) window.location.href = '/dashboard/products'
}

// Link → <a>
<a href="/dashboard/products">Back to products</a>
```

### 6.4 `StoreSettingsForm.tsx` — same pattern

```typescript
// BEFORE
import { updateStore } from '@/lib/actions/store'
const router = useRouter()
const result = await updateStore(store.id, data)
if (result.success) router.refresh()

// AFTER
import { apiPost } from '@/lib/api'
const result = await apiPost('/api/stores/update', { storeId: store.id, ...data })
if (result.success) window.location.reload()  // force fresh data
```

### 6.5 `CategoryManager.tsx` — replace server action imports + useRouter

```typescript
// BEFORE
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/category'
const router = useRouter()
// ... calls and router.refresh()

// AFTER
import { apiPost, apiDelete } from '@/lib/api'

// createCategory
const result = await apiPost('/api/categories/create', { name: newName })
if (result.success) window.location.reload()

// updateCategory
const result = await apiPost('/api/categories/update', { categoryId, name })
if (result.success) window.location.reload()

// deleteCategory
const result = await apiPost('/api/categories/delete', { categoryId })
if (result.success) window.location.reload()
```

### 6.6 `ProductListTable.tsx` — replace server action imports

```typescript
// BEFORE
import { toggleProductActive, toggleProductFeatured, deleteProduct } from '@/lib/actions/product'

// AFTER
import { apiPost } from '@/lib/api'

// toggleProductActive
await apiPost('/api/products/toggle-active', { productId, isActive })
window.location.reload()

// toggleProductFeatured
await apiPost('/api/products/toggle-featured', { productId, isFeatured })
window.location.reload()

// deleteProduct
await apiPost('/api/products/delete', { productId })
window.location.reload()
```

### 6.7 `OnboardingModal.tsx` + `StoreOnboarding.tsx` — replace createStore

```typescript
// BEFORE
import { createStore } from '@/lib/actions/store'
const result = await createStore(data)
if (result.success) router.push('/dashboard')

// AFTER
import { apiPost } from '@/lib/api'
const result = await apiPost('/api/stores/create', data)
if (result.success) window.location.href = '/dashboard'
```

### 6.8 `WhatsAppButton.tsx` — replace trackWhatsAppClick

```typescript
// BEFORE
import { trackWhatsAppClick } from '@/lib/actions/analytics'
void trackWhatsAppClick(storeId, productId)

// AFTER
fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ storeId, productId }),
})
// fire-and-forget, no await needed
```

### 6.9 `GoogleAuthButton.tsx` — no changes needed

Uses `createBrowserClient` and `window.location.origin`. Works unchanged.

### 6.10 Auth pages (LoginPage, SignUpPage, etc.) — no changes needed

These use `createBrowserClient` for auth. No server action imports. Copy as-is.

### 6.11 `TrialBanner.tsx`, `BlockedStoreScreen.tsx`, `CopyButton.tsx` — no changes

No Next.js specific imports. Copy as-is.

---

## Phase 7 — Globals CSS

Copy `app/globals.css` to `src/styles/globals.css` unchanged. Import in RootLayout:
```astro
---
import '@/styles/globals.css'
---
```

The Tailwind v4 config (`postcss.config.mjs`) copies as-is. Cloudflare Workers supports CSS processing.

---

## Phase 8 — Deployment Setup

### Cloudflare Pages config

In Cloudflare Dashboard → Pages → Create a project:
- **Framework preset:** Astro
- **Build command:** `pnpm build`
- **Build output directory:** `dist`
- **Root directory:** `apps/store`

Environment variables to set in Cloudflare dashboard:
```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
PUBLIC_APP_URL=https://store.yourdomain.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Keep admin on Vercel (separate deployment)

Admin stays at same repo but deploy only `apps/admin/`:
- **Root directory in Vercel:** `apps/admin`
- Admin Supabase URL/keys stay in Vercel env vars

### Custom domain setup

```
yourdomain.com           → Cloudflare Pages (Astro store)
admin.yourdomain.com     → Vercel (Next.js admin) — or keep as vercel URL
```

Update Supabase Auth → Allowed redirect URLs:
```
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/confirm
```

---

## Phase 9 — Migration Execution Order

Do in this exact order. Each step is independently testable.

### Step 1 — Monorepo (Day 1)
- [ ] Create `pnpm-workspace.yaml`
- [ ] Move Next.js into `apps/admin/` (keep all files, trim later)
- [ ] Test: `pnpm --filter admin dev` still works

### Step 2 — Astro scaffold (Day 1)
- [ ] `pnpm create astro@latest apps/store`
- [ ] Install all dependencies
- [ ] Configure `astro.config.mjs`, `wrangler.toml`, `tsconfig.json`
- [ ] Test: `pnpm --filter store dev` runs empty project

### Step 3 — Core lib + middleware (Day 2)
- [ ] Copy all `lib/` files, update env var prefixes
- [ ] Rewrite `lib/supabase/server.ts`
- [ ] Write `src/middleware.ts`
- [ ] Write `src/lib/api-guard.ts` and `src/lib/api.ts`
- [ ] Test: middleware redirects unauthenticated requests to `/auth/login`

### Step 4 — Auth API routes (Day 2–3)
- [ ] `src/pages/api/auth/callback.ts`
- [ ] `src/pages/api/auth/confirm.ts`
- [ ] Copy all `components/ui/*` unchanged
- [ ] Create auth page shells (`login.astro`, `sign-up.astro`, etc.)
- [ ] Extract auth page JSX into `components/auth/LoginPage.tsx` etc.
- [ ] Test: full login flow, Google OAuth, logout, password reset

### Step 5 — Storefront (Day 3–4)
- [ ] Copy `components/store/*` unchanged
- [ ] `src/pages/s/[storeSlug]/index.astro`
- [ ] `src/pages/s/[storeSlug]/[productSlug].astro`
- [ ] `src/pages/s/[storeSlug]/products.astro`
- [ ] Copy `globals.css`, verify themes work
- [ ] Test: open a store URL, verify all 3 themes, verify WhatsApp link, verify analytics track

### Step 6 — Cloudinary API route (Day 4)
- [ ] `src/pages/api/cloudinary/sign.ts`
- [ ] Test: sign endpoint returns valid signature, test upload from browser

### Step 7 — Dashboard data pages (Day 4–5)
- [ ] `src/layouts/DashboardLayout.astro`
- [ ] `src/pages/dashboard/index.astro`
- [ ] `src/pages/dashboard/analytics.astro`
- [ ] Test: dashboard loads, analytics data displays

### Step 8 — Product CRUD API routes (Day 5–6)
- [ ] All 5 product API routes
- [ ] Update `ProductForm.tsx` (remove useRouter, server action imports)
- [ ] Update `ProductListTable.tsx`
- [ ] `src/pages/dashboard/products/index.astro`
- [ ] `src/pages/dashboard/products/new.astro`
- [ ] `src/pages/dashboard/products/[id]/edit.astro`
- [ ] Test: create product, edit product, delete, toggle active, toggle featured, image upload

### Step 9 — Store + Category CRUD (Day 6–7)
- [ ] Store API routes
- [ ] Category API routes
- [ ] Update `StoreSettingsForm.tsx`
- [ ] Update `CategoryManager.tsx`
- [ ] Update `OnboardingModal.tsx`, `StoreOnboarding.tsx`
- [ ] `src/pages/dashboard/settings.astro`
- [ ] `src/pages/dashboard/categories.astro`
- [ ] Test: onboarding flow, store settings update, category CRUD

### Step 10 — Analytics tracking (Day 7)
- [ ] `src/pages/api/analytics/track.ts`
- [ ] Update `WhatsAppButton.tsx`
- [ ] Test: click WhatsApp button, verify analytics_events row inserted

### Step 11 — Landing page (Day 7)
- [ ] `src/pages/index.astro`
- [ ] Port landing page JSX
- [ ] Test: landing page renders, buttons link correctly

### Step 12 — Cloudflare deploy + DNS (Day 8)
- [ ] Set env vars in Cloudflare Pages
- [ ] Deploy, verify build succeeds
- [ ] Add `nodejs_compat` flag if not already set
- [ ] Test: end-to-end full flow on production URL
- [ ] Update Supabase allowed redirect URLs

### Step 13 — Admin cleanup (Day 8–9)
- [ ] Remove from `apps/admin/`: `app/auth/`, `app/dashboard/`, `app/s/`, `app/page.tsx`
- [ ] Remove components not used by admin
- [ ] Verify admin still works on Vercel

---

## Complete Dependency List for Astro Project

```json
{
  "dependencies": {
    "astro": "^5.x",
    "@astrojs/react": "^4.x",
    "@astrojs/cloudflare": "^12.x",
    "@astrojs/tailwind": "^5.x",
    "react": "^19",
    "react-dom": "^19",
    "@supabase/ssr": "^0.10.2",
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-accordion": "1.2.12",
    "@radix-ui/react-alert-dialog": "1.1.15",
    "@radix-ui/react-avatar": "1.1.11",
    "@radix-ui/react-checkbox": "1.3.3",
    "@radix-ui/react-collapsible": "1.1.12",
    "@radix-ui/react-dialog": "1.1.15",
    "@radix-ui/react-dropdown-menu": "2.1.16",
    "@radix-ui/react-label": "2.1.8",
    "@radix-ui/react-popover": "1.1.15",
    "@radix-ui/react-progress": "1.1.8",
    "@radix-ui/react-radio-group": "1.3.8",
    "@radix-ui/react-scroll-area": "1.2.10",
    "@radix-ui/react-select": "2.2.6",
    "@radix-ui/react-separator": "1.1.8",
    "@radix-ui/react-slot": "1.2.4",
    "@radix-ui/react-switch": "1.2.6",
    "@radix-ui/react-tabs": "1.1.13",
    "@radix-ui/react-toast": "1.2.15",
    "@radix-ui/react-toggle": "1.1.10",
    "@radix-ui/react-toggle-group": "1.1.11",
    "@radix-ui/react-tooltip": "1.2.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.1.1",
    "date-fns": "4.1.0",
    "embla-carousel-react": "8.6.0",
    "input-otp": "1.4.2",
    "lucide-react": "^0.564.0",
    "react-day-picker": "9.13.2",
    "react-easy-crop": "^5.5.7",
    "react-hook-form": "^7.54.1",
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.0",
    "sonner": "^1.7.1",
    "tailwind-merge": "^3.3.1",
    "vaul": "^1.1.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4.2.0",
    "tw-animate-css": "1.3.3",
    "typescript": "5.7.3"
  }
}
```

Dropped from Astro project (Next.js only):
- `next` — removed
- `next-themes` — removed (CSS [data-theme] already handles theming)
- `@vercel/analytics` — removed (Cloudflare has free Web Analytics, or just remove)

---

## Key Patterns Reference

### Reading params in Astro pages
```typescript
// Next.js
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

// Astro
const { slug } = Astro.params
```

### Reading search params
```typescript
// Next.js
const { category } = await searchParams

// Astro
const category = Astro.url.searchParams.get('category')
```

### Redirects
```typescript
// Next.js
import { redirect } from 'next/navigation'
redirect('/auth/login')

// Astro
return Astro.redirect('/auth/login')
```

### Not found
```typescript
// Next.js
import { notFound } from 'next/navigation'
notFound()

// Astro
return new Response(null, { status: 404 })
```

### After mutation (page refresh)
```typescript
// Next.js (server action)
revalidatePath(ROUTES.DASHBOARD_PRODUCTS)

// Astro — drop completely, or in client component:
window.location.reload()
// OR for navigation:
window.location.href = '/dashboard/products'
```

### Env vars
```typescript
// Next.js
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.CLOUDINARY_API_SECRET

// Astro
import.meta.env.PUBLIC_SUPABASE_URL
import.meta.env.CLOUDINARY_API_SECRET
```

---

## Testing Checklist (Before DNS Cutover)

### Auth
- [ ] Email + password login works
- [ ] Google OAuth login works (check callback URL matches)
- [ ] Sign up creates account and redirects to dashboard
- [ ] Forgot password sends email
- [ ] Password reset link works
- [ ] Logout clears session
- [ ] Unauthenticated access to `/dashboard` redirects to login
- [ ] Authenticated seller cannot access `/admin`

### Dashboard
- [ ] Onboarding modal appears for new seller, creates store
- [ ] Dashboard overview shows correct product counts
- [ ] Store URL copy button works
- [ ] Products list shows all products
- [ ] Add product form submits and creates product
- [ ] Edit product form submits and updates product
- [ ] Toggle active/featured updates product
- [ ] Delete product removes it
- [ ] Image upload (crop + Cloudinary) works end-to-end
- [ ] Categories create/update/delete
- [ ] Store settings update (name, WhatsApp, theme, logo, banner)
- [ ] Analytics page shows data
- [ ] Blocked store shows BlockedStoreScreen

### Storefront
- [ ] Store homepage loads at `/s/[slug]`
- [ ] All 3 themes (minimal, modern, luxury) render correctly
- [ ] Product cards link to product pages
- [ ] Product page shows images, price, description
- [ ] WhatsApp button opens correct deep link
- [ ] Analytics event fires on store visit
- [ ] Analytics event fires on product visit
- [ ] Analytics event fires on WhatsApp click
- [ ] Category filter on products page works
- [ ] Blocked/paused store shows unavailable screen
- [ ] OG metadata correct (check with og:image debugger)

### Performance
- [ ] Cloudflare Workers response time < 200ms for storefront
- [ ] No Node.js module errors in Cloudflare logs
- [ ] `nodejs_compat` flag active (verify in wrangler.toml)
