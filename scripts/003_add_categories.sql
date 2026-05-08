-- ============================================================
-- MicroStore Migration 003: Add Categories
-- Run after 002_supabase_setup.sql
-- ============================================================

-- 1) Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug),
  CONSTRAINT categories_name_length CHECK (char_length(name) <= 60),
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE public.categories IS 'Product categories belonging to stores';

-- 2) Add category_id FK to products (nullable — products can have no category)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3) RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_select_own ON public.categories;
DROP POLICY IF EXISTS categories_insert_own ON public.categories;
DROP POLICY IF EXISTS categories_update_own ON public.categories;
DROP POLICY IF EXISTS categories_delete_own ON public.categories;
DROP POLICY IF EXISTS categories_select_public ON public.categories;
DROP POLICY IF EXISTS categories_admin_all ON public.categories;

-- Store owner can manage their own categories
CREATE POLICY categories_select_own ON public.categories
  FOR SELECT USING (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY categories_insert_own ON public.categories
  FOR INSERT WITH CHECK (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY categories_update_own ON public.categories
  FOR UPDATE USING (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY categories_delete_own ON public.categories
  FOR DELETE USING (
    (select auth.uid()) = (SELECT owner_id FROM public.stores WHERE id = store_id)
  );

-- Public can read categories for active/unblocked stores
CREATE POLICY categories_select_public ON public.categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = categories.store_id
        AND stores.status IN ('active', 'trial')
        AND stores.is_blocked = false
    )
  );

-- Admin can do everything
CREATE POLICY categories_admin_all ON public.categories
  FOR ALL USING ((select public.is_admin()));

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(store_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
