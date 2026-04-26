import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StoreSettingsForm } from "@/components/dashboard/StoreSettingsForm"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard")

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Store Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Update your store information and theme.</p>
      </div>
      <StoreSettingsForm store={store} />
    </div>
  )
}
