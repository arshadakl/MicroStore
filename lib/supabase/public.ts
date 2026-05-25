import { createClient } from "@supabase/supabase-js"

// Anonymous Supabase client for public storefront pages.
// Does NOT read cookies → Next.js can statically cache renders (ISR).
// Use this ONLY for public, unauthenticated reads (storefront, product pages).
// For authenticated operations always use lib/supabase/server.ts.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
