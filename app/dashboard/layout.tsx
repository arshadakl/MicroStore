import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { TrialBanner } from "@/components/dashboard/TrialBanner"
import { BlockedStoreScreen } from "@/components/dashboard/BlockedStoreScreen"
import { isAdminUser } from "@/lib/supabase/roles"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Check if user is admin - redirect to admin dashboard
  const isAdmin = isAdminUser(user)
  if (isAdmin) {
    redirect("/admin")
  }

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  // If store is blocked or paused, show blocked screen
  if (store?.is_blocked || store?.status === "blocked" || store?.status === "paused") {
    return <BlockedStoreScreen store={store} />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar store={store} userEmail={user.email ?? ""} />
      <div className="flex-1 flex flex-col overflow-auto">
        {store && <TrialBanner store={store} />}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
