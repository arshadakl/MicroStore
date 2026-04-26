import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ExternalLink, Plus, MessageCircle } from "lucide-react"
import { StoreOnboarding } from "@/components/dashboard/StoreOnboarding"
import { CopyButton } from "@/components/dashboard/CopyButton"
import { getStatusLabel, getStatusColor, getTrialDaysRemaining } from "@/types"
import { ROUTES } from "@/lib/constants"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  // Fetch store for current user
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  // Fetch products if store exists
  const { data: products } = store
    ? await supabase.from("products").select("*").eq("store_id", store.id)
    : { data: [] }

  // Show onboarding if no store
  if (!store) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome to MicroStore
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Let&apos;s set up your store in 2 minutes.
          </p>
        </div>
        <StoreOnboarding />
      </div>
    )
  }

  // Calculate stats
  const totalProducts = products?.length ?? 0
  const featuredCount = products?.filter((p) => p.is_featured).length ?? 0
  const activeCount = products?.filter((p) => p.is_active).length ?? 0
  const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${store.slug}`
  const trialDays =
    store.status === "trial" ? getTrialDaysRemaining(store.trial_ends_at) : null

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {store.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Your store overview
            </p>
          </div>
          <Badge className={getStatusColor(store.status)} variant="outline">
            {getStatusLabel(store.status)}
            {trialDays !== null && trialDays > 0 && ` (${trialDays}d)`}
          </Badge>
        </div>
        <Button
          asChild
          className="bg-whatsapp hover:bg-whatsapp-dark text-white gap-2"
        >
          <Link href={ROUTES.DASHBOARD_PRODUCTS_NEW}>
            <Plus className="w-4 h-4" />
            Add product
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-whatsapp" />
              <span className="text-2xl font-bold text-foreground">
                {totalProducts}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-foreground">
                {activeCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Featured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-foreground">
                {featuredCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-whatsapp" />
              <span className="text-sm font-medium text-foreground truncate">
                {store.whatsapp_number}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">
            Your Store Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md text-muted-foreground break-all">
              {storeUrl}
            </code>
            <CopyButton text={storeUrl} />
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <a
                href={ROUTES.storefront(store.slug)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open store in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {totalProducts === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <Package className="w-10 h-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">No products yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first product to start selling.
              </p>
            </div>
            <Button
              asChild
              className="bg-whatsapp hover:bg-whatsapp-dark text-white gap-2"
            >
              <Link href={ROUTES.DASHBOARD_PRODUCTS_NEW}>
                <Plus className="w-4 h-4" />
                Add your first product
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
