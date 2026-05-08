import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { TrialBanner } from "@/components/dashboard/TrialBanner"
import { BlockedStoreScreen } from "@/components/dashboard/BlockedStoreScreen"
import { isAdminUser } from "@/lib/supabase/roles"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const isAdmin = isAdminUser(user)
  if (isAdmin) redirect("/admin")

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  if (store?.is_blocked || store?.status === "blocked" || store?.status === "paused") {
    return <BlockedStoreScreen store={store} />
  }

  const { count: productCount } = store
    ? await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id)
    : { count: 0 }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        store={store}
        userEmail={user.email ?? ""}
        productCount={productCount ?? 0}
      />
      <div className="flex-1 flex flex-col overflow-auto pt-14 md:pt-0">
        {store && <TrialBanner store={store} />}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
