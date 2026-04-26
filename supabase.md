# Supabase Setup Guide — MicroStore

This file documents **everything** you need to configure in your Supabase project for MicroStore to work correctly.

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Authentication Setup](#2-authentication-setup)
3. [Database Tables](#3-database-tables)
4. [Row Level Security (RLS) Policies](#4-row-level-security-rls-policies)
5. [Database Triggers & Functions](#5-database-triggers--functions)
6. [Setting Up an Admin User](#6-setting-up-an-admin-user)
7. [Storage (Image Uploads)](#7-storage-image-uploads)
8. [Database Indexes](#8-database-indexes)
9. [Migration from Old Schema](#9-migration-from-old-schema)
10. [Quick Pre-Launch Checklist](#10-quick-pre-launch-checklist)
11. [Development Tips](#11-development-tips)
12. [Security Notes](#12-security-notes)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Environment Variables

Add the following to your `.env.local` file (and in Vercel project settings under Environment Variables):

```env
# Required - Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required - App URL (for redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional - For v0 development redirect proxy
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=your-v0-redirect-url
```

**Where to find these values:**
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: **Settings > API** in Supabase dashboard
- Never expose the `service_role` key in client-side code

---

## 2. Authentication Setup

Go to **Authentication > Settings** in your Supabase dashboard:

### 2.1 — Email Provider

1. Enable **Email** as a sign-in provider
2. Configure email templates (optional but recommended)

### 2.2 — Site URL & Redirect URLs

1. Set **Site URL** to your production domain:
   ```
   https://yourdomain.com
   ```

2. Add the following to **Redirect URLs**:
   ```
   https://yourdomain.com/auth/callback
   http://localhost:3000/auth/callback
   ```

### 2.3 — Email Confirmation (Development)

- **Development**: Optionally disable "Confirm email" to skip the confirmation step
- **Production**: Always enable email confirmation for security

### 2.4 — Password Requirements

The app enforces:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

## 3. Database Tables

Run the following SQL scripts in **SQL Editor** inside your Supabase project.

### 3.1 — stores table

```sql
-- ============================================================
-- STORES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stores (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner reference (links to auth.users)
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Store details
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  
  -- Media
  logo_url TEXT,
  banner_url TEXT,
  
  -- Contact
  whatsapp_number TEXT NOT NULL,
  
  -- Theme (minimal, modern, luxury)
  theme_id TEXT NOT NULL DEFAULT 'minimal' 
    CHECK (theme_id IN ('minimal', 'modern', 'luxury')),
  
  -- Status & Trial
  status TEXT NOT NULL DEFAULT 'trial' 
    CHECK (status IN ('trial', 'active', 'paused', 'blocked')),
  trial_ends_at TIMESTAMPTZ,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT stores_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT stores_whatsapp_format CHECK (whatsapp_number ~ '^\+[1-9]\d{6,14}$')
);

-- Add comment
COMMENT ON TABLE public.stores IS 'Seller stores with trial/subscription management';
```

### 3.2 — products table

```sql
-- ============================================================
-- PRODUCTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Store reference
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Product details
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0 
    CHECK (price >= 0 AND price <= 9999999),
  description TEXT,
  
  -- Media (array of HTTPS URLs)
  images TEXT[] DEFAULT '{}',
  
  -- Flags
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Unique slug per store
  UNIQUE(store_id, slug),
  
  -- Constraints
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT products_title_length CHECK (char_length(title) <= 200),
  CONSTRAINT products_description_length CHECK (char_length(description) <= 2000)
);

-- Add comment
COMMENT ON TABLE public.products IS 'Products belonging to stores';
```

### 3.3 — analytics_events table

```sql
-- ============================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Event type
  event_type TEXT NOT NULL 
    CHECK (event_type IN ('view', 'click_whatsapp', 'product_view')),
  
  -- Metadata (for future use)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.analytics_events IS 'Anonymous analytics events for stores';
```

---

## 4. Row Level Security (RLS) Policies

### 4.1 — Enable RLS on all tables

```sql
-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
```

### 4.2 — Stores policies

```sql
-- ============================================================
-- STORES RLS POLICIES
-- ============================================================

-- Owner can read their own store
CREATE POLICY "stores_select_own" ON public.stores
  FOR SELECT USING (auth.uid() = owner_id);

-- Owner can insert their own store
CREATE POLICY "stores_insert_own" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owner can update their own store
CREATE POLICY "stores_update_own" ON public.stores
  FOR UPDATE USING (auth.uid() = owner_id);

-- Owner can delete their own store
CREATE POLICY "stores_delete_own" ON public.stores
  FOR DELETE USING (auth.uid() = owner_id);

-- Public can read active/trial stores (not blocked/paused)
CREATE POLICY "stores_select_public" ON public.stores
  FOR SELECT USING (
    status IN ('active', 'trial') AND is_blocked = false
  );

-- Admin can do everything
CREATE POLICY "stores_admin_all" ON public.stores
  FOR ALL USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );
```

### 4.3 — Products policies

```sql
-- ============================================================
-- PRODUCTS RLS POLICIES
-- ============================================================

-- Public can read active products from non-blocked stores
CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = products.store_id 
      AND stores.status IN ('active', 'trial')
      AND stores.is_blocked = false
    )
  );

-- Store owner can select all their products (including inactive)
CREATE POLICY "products_select_own" ON public.products
  FOR SELECT USING (
    auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

-- Store owner can insert products
CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

-- Store owner can update their products
CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (
    auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

-- Store owner can delete their products
CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (
    auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

-- Admin can do everything
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );
```

### 4.4 — Analytics policies

```sql
-- ============================================================
-- ANALYTICS RLS POLICIES
-- ============================================================

-- Anyone can insert events (anonymous tracking)
CREATE POLICY "analytics_insert_any" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Store owner can read their events
CREATE POLICY "analytics_select_own" ON public.analytics_events
  FOR SELECT USING (
    auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

-- Admin can read all events
CREATE POLICY "analytics_admin_select" ON public.analytics_events
  FOR SELECT USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );
```

---

## 5. Database Triggers & Functions

### 5.1 — Auto-update `updated_at` timestamp

```sql
-- ============================================================
-- FUNCTION: Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stores
DROP TRIGGER IF EXISTS stores_updated_at ON public.stores;
CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for products
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 5.2 — Auto-set trial end date on store creation

```sql
-- ============================================================
-- FUNCTION: Set trial end date
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial end date to 7 days from now if not set
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at = NOW() + INTERVAL '7 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new stores
DROP TRIGGER IF EXISTS stores_set_trial ON public.stores;
CREATE TRIGGER stores_set_trial
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_store();
```

### 5.3 — Prevent blocked store from creating products (optional)

```sql
-- ============================================================
-- FUNCTION: Prevent blocked store products
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_store_not_blocked()
RETURNS TRIGGER AS $$
DECLARE
  store_record RECORD;
BEGIN
  SELECT is_blocked, status INTO store_record
  FROM public.stores
  WHERE id = NEW.store_id;
  
  IF store_record.is_blocked OR store_record.status = 'blocked' THEN
    RAISE EXCEPTION 'Cannot add products to a blocked store';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product inserts
DROP TRIGGER IF EXISTS products_check_blocked ON public.products;
CREATE TRIGGER products_check_blocked
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_store_not_blocked();
```

---

## 6. Setting Up an Admin User

To create a super admin user:

1. First, create a normal user account via sign-up
2. Go to **Authentication > Users** in Supabase dashboard
3. Find the user and click on them
4. In the **App metadata** section, click **Edit**
5. Add the following JSON:
   ```json
   {
     "role": "admin"
   }
   ```
6. Click **Save**

The user will now have admin access to `/admin/*` routes.

**Alternative: SQL method (recommended)**
```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@yourdomain.com';
```

---

## 7. Storage (Image Uploads)

If you want sellers to upload images directly (instead of pasting URLs):

### 7.1 — Create bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it: `store-assets`
4. Set it to **Public**

### 7.2 — Storage policies

```sql
-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "store_assets_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets' AND 
    auth.role() = 'authenticated'
  );

-- Allow public to view all files
CREATE POLICY "store_assets_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

-- Allow users to update their own files
CREATE POLICY "store_assets_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'store-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own files
CREATE POLICY "store_assets_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'store-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 7.3 — Upload path convention

```
{user_id}/logo.png
{user_id}/banner.jpg
{user_id}/products/{product_id}/{filename}.jpg
```

---

## 8. Database Indexes

Create indexes for better query performance:

```sql
-- ============================================================
-- DATABASE INDEXES
-- ============================================================

-- Stores indexes
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_is_blocked ON public.stores(is_blocked);
CREATE INDEX IF NOT EXISTS idx_stores_trial_ends_at ON public.stores(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON public.stores(created_at DESC);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_store_id ON public.analytics_events(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_store_featured 
  ON public.products(store_id, is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stores_active 
  ON public.stores(status, is_blocked) WHERE status IN ('active', 'trial');
```

---

## 9. Migration from Old Schema

If you already have the old schema without trial/blocking columns:

```sql
-- ============================================================
-- MIGRATION SCRIPT
-- ============================================================

-- Step 1: Add new columns to stores
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'trial' 
    CHECK (status IN ('trial', 'active', 'paused', 'blocked')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Step 2: Migrate user_id to owner_id if needed
UPDATE public.stores 
SET owner_id = user_id 
WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- Step 3: Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Step 4: Set trial end date for existing stores (7 days from now)
UPDATE public.stores 
SET trial_ends_at = NOW() + INTERVAL '7 days'
WHERE trial_ends_at IS NULL;

-- Step 5: Update theme_id constraint
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_theme_id_check;
ALTER TABLE public.stores ADD CONSTRAINT stores_theme_id_check 
  CHECK (theme_id IN ('minimal', 'modern', 'luxury'));

-- Step 6: Add analytics metadata column
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
```

---

## 10. Quick Pre-Launch Checklist

Before going live, confirm:

### Database
- [ ] `stores` table created with all columns
- [ ] `products` table created with all columns
- [ ] `analytics_events` table created
- [ ] All RLS policies created and tested
- [ ] All indexes created
- [ ] Triggers created (updated_at, trial_ends_at)

### Authentication
- [ ] Email provider enabled
- [ ] Site URL configured
- [ ] Redirect URLs added (production + localhost)
- [ ] At least one admin user created with `role: "admin"` metadata

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain

### Storage (Optional)
- [ ] `store-assets` bucket created and set to public
- [ ] Storage policies configured

### Testing
- [ ] Sign up flow works
- [ ] Store creation works with 7-day trial
- [ ] Product CRUD works
- [ ] Public storefront loads correctly
- [ ] Blocked stores show unavailable page
- [ ] Admin panel accessible to admin users only

---

## 11. Development Tips

- During development, disable email confirmation in Supabase Auth settings
- Use the Supabase Table Editor to manually seed test data
- Use the SQL Editor to run the table creation scripts
- Test the full flow: sign up → create store → add product → visit `/s/your-slug`
- Test admin flow: set yourself as admin → visit `/admin` → manage stores
- Use the Supabase logs to debug RLS policy issues

---

## 12. Security Notes

### Application Security
- All mutations go through server actions with Zod validation
- Password requirements: 8+ chars, uppercase, lowercase, number
- WhatsApp numbers validated in E.164 format
- All text inputs sanitized to prevent XSS
- Image URLs must be HTTPS

### Database Security
- RLS policies ensure users can only access their own data
- Admin policies check `app_metadata.role === 'admin'`
- Public storefront only shows active/trial, non-blocked stores
- Products are only visible if their store is not blocked
- Cascading deletes ensure data integrity

### Rate Limiting (Recommended)
Consider adding rate limiting for:
- Sign-up attempts (prevent spam accounts)
- Store creation (one store per user enforced in code)
- Analytics events (prevent spam)

---

## 13. Troubleshooting

### Common Issues

**"Permission denied for table stores"**
- RLS is enabled but policies are missing
- Run the RLS policy scripts in Section 4

**"User cannot create store"**
- Check if user is authenticated
- Check if user already has a store (one per user limit)

**"Store not showing on public page"**
- Check store status is 'active' or 'trial'
- Check `is_blocked` is false
- Check RLS public policy exists

**"Admin routes show 403"**
- Verify user has `role: "admin"` in user_metadata
- Check admin RLS policies exist

**"Products not loading"**
- Check product `is_active` is true
- Check parent store is not blocked
- Check RLS policies for products

### Useful Debug Queries

```sql
-- Check store status
SELECT id, name, status, is_blocked, trial_ends_at FROM stores;

-- Check user metadata
SELECT id, email, raw_app_meta_data FROM auth.users;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'stores';

-- Test RLS as a user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM stores; -- Should only show user's store
RESET request.jwt.claims;
```

---

## Full Setup Script (Copy & Run)

Use the ready script in this repo:
- `scripts/002_supabase_setup.sql`

It includes tables, RLS policies, triggers, indexes, and app-metadata-based admin policies.

```sql
-- Run the script file contents in Supabase SQL Editor
-- scripts/002_supabase_setup.sql
```
