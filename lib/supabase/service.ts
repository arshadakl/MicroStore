import { createClient } from "@supabase/supabase-js"

// Bypasses ALL RLS. Call only from server-side admin-verified code paths.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
