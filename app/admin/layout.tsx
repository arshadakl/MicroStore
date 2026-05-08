import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { isAdminUser } from "@/lib/supabase/roles"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Check if user is admin
  const isAdmin = isAdminUser(user)
  if (!isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar userEmail={user.email ?? ""} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
