-- ============================================================
-- WhatsApp-First Micro Store Platform – Database Schema
-- ============================================================

-- stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  whatsapp_number TEXT NOT NULL DEFAULT '',
  theme_id TEXT NOT NULL DEFAULT 'minimal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_select_own" ON public.stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stores_insert_own" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stores_update_own" ON public.stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stores_delete_own" ON public.stores FOR DELETE USING (auth.uid() = user_id);

-- Public can view all stores (for storefront pages)
CREATE POLICY "stores_select_public" ON public.stores FOR SELECT USING (true);

-- products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  description TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Owner can do full CRUD (via store ownership)
CREATE POLICY "products_select_owner" ON public.products FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "products_insert_owner" ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "products_update_owner" ON public.products FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "products_delete_owner" ON public.products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

-- Public can view all products (for storefront pages)
CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (true);

-- analytics_events table (optional, v1.5)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click_whatsapp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (anonymous tracking)
CREATE POLICY "analytics_insert_public" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- Owners can view their store analytics
CREATE POLICY "analytics_select_owner" ON public.analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = analytics_events.store_id AND stores.user_id = auth.uid())
  );

-- Trigger: auto-create store on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_store()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Generate a base slug from the email prefix
  base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  final_slug := base_slug;

  -- Ensure slug uniqueness
  WHILE EXISTS (SELECT 1 FROM public.stores WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.stores (user_id, name, slug, whatsapp_number, theme_id)
  VALUES (NEW.id, 'My Store', final_slug, '', 'minimal')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_store ON auth.users;

CREATE TRIGGER on_auth_user_created_store
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_store();

-- Storage bucket for product/store images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "store_assets_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "store_assets_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "store_assets_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can read from the public bucket
CREATE POLICY "store_assets_read_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');
