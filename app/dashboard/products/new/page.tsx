import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/dashboard/ProductForm"

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard")

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Add Product</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Fill in the details below to add a new product.</p>
      </div>
      <ProductForm storeId={store.id} />
    </div>
  )
}
