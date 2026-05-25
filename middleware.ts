import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Only run middleware on routes that need auth. Storefront (/s/*), landing (/),
  // and API routes handle their own auth — excluding them eliminates a Supabase
  // auth.getUser() network call on every anonymous storefront request.
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/:path*"],
}
