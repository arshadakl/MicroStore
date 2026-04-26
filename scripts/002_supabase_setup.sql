-- ============================================================
-- MicroStore Supabase Bootstrap (v2)
-- Source: supabase.md (canonical) + app schema expectations
-- Idempotent: safe to re-run for table/index/function creation
-- ============================================================

-- Enable extensions used by defaults
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1) TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  logo_url TEXT,
  banner_url TEXT,
  whatsapp_number TEXT NOT NULL,
  theme_id TEXT NOT NULL DEFAULT 'minimal'
    CHECK (theme_id IN ('minimal', 'modern', 'luxury')),
  status TEXT NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'paused', 'blocked')),
  trial_ends_at TIMESTAMPTZ,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT stores_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT stores_whatsapp_format CHECK (whatsapp_number ~ '^\+[1-9]\d{6,14}$')
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (price >= 0 AND price <= 9999999),
  description TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(store_id, slug),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT products_title_length CHECK (char_length(title) <= 200),
  CONSTRAINT products_description_length CHECK (
    description IS NULL OR char_length(description) <= 2000
  )
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('view', 'click_whatsapp', 'product_view')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stores IS 'Seller stores with trial/subscription management';
COMMENT ON TABLE public.products IS 'Products belonging to stores';
COMMENT ON TABLE public.analytics_events IS 'Anonymous analytics events for stores';

-- ============================================================
-- 2) RLS + POLICIES
-- ============================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop first so the script is re-runnable.
DROP POLICY IF EXISTS stores_select_own ON public.stores;
DROP POLICY IF EXISTS stores_insert_own ON public.stores;
DROP POLICY IF EXISTS stores_update_own ON public.stores;
DROP POLICY IF EXISTS stores_delete_own ON public.stores;
DROP POLICY IF EXISTS stores_select_public ON public.stores;
DROP POLICY IF EXISTS stores_admin_all ON public.stores;

DROP POLICY IF EXISTS products_select_public ON public.products;
DROP POLICY IF EXISTS products_select_own ON public.products;
DROP POLICY IF EXISTS products_insert_own ON public.products;
DROP POLICY IF EXISTS products_update_own ON public.products;
DROP POLICY IF EXISTS products_delete_own ON public.products;
DROP POLICY IF EXISTS products_admin_all ON public.products;

DROP POLICY IF EXISTS analytics_insert_any ON public.analytics_events;
DROP POLICY IF EXISTS analytics_select_own ON public.analytics_events;
DROP POLICY IF EXISTS analytics_admin_select ON public.analytics_events;

-- Safer role check: app_metadata is server-controlled.
CREATE POLICY stores_select_own ON public.stores
  FOR SELECT USING ((select auth.uid()) = owner_id);

CREATE POLICY stores_insert_own ON public.stores
  FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY stores_update_own ON public.stores
  FOR UPDATE USING ((select auth.uid()) = owner_id);

CREATE POLICY stores_delete_own ON public.stores
  FOR DELETE USING ((select auth.uid()) = owner_id);

CREATE POLICY stores_select_public ON public.stores
  FOR SELECT USING (
    status IN ('active', 'trial') AND is_blocked = false
  );

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$;

CREATE POLICY stores_admin_all ON public.stores
  FOR ALL USING ((select public.is_admin()));

CREATE POLICY products_select_public ON public.products
  FOR SELECT USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.stores
      WHERE stores.id = products.store_id
      AND stores.status IN ('active', 'trial')
      AND stores.is_blocked = false
    )
  );

CREATE POLICY products_select_own ON public.products
  FOR SELECT USING (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY products_insert_own ON public.products
  FOR INSERT WITH CHECK (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY products_update_own ON public.products
  FOR UPDATE USING (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY products_delete_own ON public.products
  FOR DELETE USING (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY products_admin_all ON public.products
  FOR ALL USING ((select public.is_admin()));

CREATE POLICY analytics_insert_any ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY analytics_select_own ON public.analytics_events
  FOR SELECT USING (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY analytics_admin_select ON public.analytics_events
  FOR SELECT USING ((select public.is_admin()));

-- ============================================================
-- 3) TRIGGERS + FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_updated_at ON public.stores;
CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at = NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_set_trial ON public.stores;
CREATE TRIGGER stores_set_trial
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_store();

CREATE OR REPLACE FUNCTION public.check_store_not_blocked()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS products_check_blocked ON public.products;
CREATE TRIGGER products_check_blocked
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_store_not_blocked();

-- ============================================================
-- 4) INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_is_blocked ON public.stores(is_blocked);
CREATE INDEX IF NOT EXISTS idx_stores_trial_ends_at ON public.stores(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON public.stores(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_store_id ON public.analytics_events(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_store_featured
  ON public.products(store_id, is_featured)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_stores_active
  ON public.stores(status, is_blocked)
  WHERE status IN ('active', 'trial');

-- ============================================================
-- 5) OPTIONAL STORAGE POLICIES
-- Run this only after creating a public bucket named `store-assets`.
-- ============================================================

-- CREATE POLICY store_assets_upload ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'store-assets' AND auth.role() = 'authenticated'
--   );
--
-- CREATE POLICY store_assets_read ON storage.objects
--   FOR SELECT USING (bucket_id = 'store-assets');
--
-- CREATE POLICY store_assets_update ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'store-assets'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- CREATE POLICY store_assets_delete ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'store-assets'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );

-- ============================================================
-- 6) ADMIN BOOTSTRAP (manual after signup)
-- Use app metadata for authorization claims.
-- ============================================================

-- UPDATE auth.users
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- WHERE email = 'admin@yourdomain.com';
