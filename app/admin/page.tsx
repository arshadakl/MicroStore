import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getAdminStats } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Store,
  Package,
  Users,
  AlertTriangle,
  Ban,
  Pause,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { stats, error } = await getAdminStats()

  if (error || !stats) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <p className="text-destructive">Failed to load admin stats: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of all stores and sellers</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-foreground">{stats.totalStores}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-foreground">{stats.totalProducts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-foreground">{stats.activeStores}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trial Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-foreground">{stats.trialStores}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.trialExpiringSoon > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    {stats.trialExpiringSoon} trial{stats.trialExpiringSoon > 1 ? "s" : ""} expiring soon
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Within 3 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.blockedStores > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Ban className="w-8 h-8 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">
                    {stats.blockedStores} blocked store{stats.blockedStores > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">Requires attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.pausedStores > 0 && (
          <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/20 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Pause className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {stats.pausedStores} paused store{stats.pausedStores > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Temporarily inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View all stores, manage status, extend trials, and more.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/stores">
                View All Stores <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse all products across all stores.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/products">
                View All Products <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
