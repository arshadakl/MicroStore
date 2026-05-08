import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCategoriesByStoreId } from "@/lib/queries"
import { CategoryManager } from "@/components/dashboard/CategoryManager"
import { CATEGORY_LIMITS } from "@/lib/constants"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard")

  const categories = await getCategoriesByStoreId(store.id)

  return (
    <div className="px-4 py-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Categories</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Organise your products into categories. Up to {CATEGORY_LIMITS.MAX_CATEGORIES_PER_STORE} categories allowed.
        </p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  )
}
