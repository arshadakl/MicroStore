import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isAdminUser } from "@/lib/supabase/roles"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  const isAuthRoute = pathname.startsWith("/auth")
  const isDashboardRoute = pathname.startsWith("/dashboard")
  const isAdminRoute = pathname.startsWith("/admin")

  // ============================================================
  // NOT AUTHENTICATED
  // ============================================================
  if (!user) {
    // Protect dashboard routes
    if (isDashboardRoute) {
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Protect admin routes
    if (isAdminRoute) {
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // ============================================================
  // AUTHENTICATED USER
  // ============================================================
  const isAdmin = isAdminUser(user)

  // Redirect away from auth routes if logged in
  if (isAuthRoute && !pathname.startsWith("/auth/callback")) {
    url.pathname = isAdmin ? "/admin" : "/dashboard"
    return NextResponse.redirect(url)
  }

  // ============================================================
  // ADMIN ROUTE PROTECTION
  // ============================================================
  if (isAdminRoute && !isAdmin) {
    // Non-admins cannot access admin routes
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // ============================================================
  // DASHBOARD ROUTE - CHECK STORE BLOCKED STATUS
  // ============================================================
  if (isDashboardRoute && !isAdmin) {
    // Check if user's store is blocked
    const { data: store } = await supabase
      .from("stores")
      .select("id, is_blocked, status")
      .eq("owner_id", user.id)
      .single()

    // If store exists and is blocked, allow access but the dashboard will show blocked state
    // We still allow access so they can see their blocked status
    if (store?.is_blocked || store?.status === "blocked") {
      // Add header to indicate blocked status for the layout to read
      supabaseResponse.headers.set("x-store-blocked", "true")
    }
  }

  return supabaseResponse
}
