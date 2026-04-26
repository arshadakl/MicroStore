import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProductListTable } from "@/components/dashboard/ProductListTable"

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard")

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your product catalogue</p>
        </div>
        <Button asChild className="bg-whatsapp hover:bg-whatsapp-dark text-white gap-2">
          <Link href="/dashboard/products/new">
            <Plus className="w-4 h-4" />
            Add product
          </Link>
        </Button>
      </div>

      <ProductListTable products={products ?? []} storeSlug={store.slug} />
    </div>
  )
}
