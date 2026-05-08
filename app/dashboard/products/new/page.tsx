import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCategoriesByStoreId } from "@/lib/queries"
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

  const categories = await getCategoriesByStoreId(store.id)

  return (
    <div className="px-4 py-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Add Product</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Fill in the details below to add a new product.</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}
