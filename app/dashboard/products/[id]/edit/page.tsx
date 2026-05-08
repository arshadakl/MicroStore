import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCategoriesByStoreId } from "@/lib/queries"
import { ProductForm } from "@/components/dashboard/ProductForm"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard")

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("store_id", store.id)
    .single()

  if (!product) notFound()

  const categories = await getCategoriesByStoreId(store.id)

  return (
    <div className="px-4 py-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit Product</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Update the details for <strong>{product.title}</strong>.</p>
      </div>
      <ProductForm product={product} categories={categories} storeSlug={store.slug} />
    </div>
  )
}
