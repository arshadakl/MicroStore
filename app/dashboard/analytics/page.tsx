import { redirect } from "next/navigation"
import type { ElementType } from "react"
import { createClient } from "@/lib/supabase/server"
import { getAnalyticsDetails, getTopProductsByClicks } from "@/lib/queries"
import { ROUTES } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, MousePointerClick, MessageCircle, TrendingUp } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard")

  const [analytics, topProducts] = await Promise.all([
    getAnalyticsDetails(store.id),
    getTopProductsByClicks(store.id, 5),
  ])

  return (
    <div className="px-4 py-6 sm:p-8 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Store performance overview</p>
      </div>

      {/* Last 7 days */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Last 7 Days
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Eye}
            label="Store Views"
            value={analytics.last7d.views}
            color="text-blue-500"
          />
          <StatCard
            icon={MousePointerClick}
            label="Product Views"
            value={analytics.last7d.productViews}
            color="text-purple-500"
          />
          <StatCard
            icon={MessageCircle}
            label="WhatsApp Clicks"
            value={analytics.last7d.waClicks}
            color="text-whatsapp"
          />
        </div>
      </section>

      {/* Last 30 days */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Last 30 Days
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Eye}
            label="Store Views"
            value={analytics.last30d.views}
            color="text-blue-500"
          />
          <StatCard
            icon={MousePointerClick}
            label="Product Views"
            value={analytics.last30d.productViews}
            color="text-purple-500"
          />
          <StatCard
            icon={MessageCircle}
            label="WhatsApp Clicks"
            value={analytics.last30d.waClicks}
            color="text-whatsapp"
          />
        </div>
      </section>

      {/* All time */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          All Time
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Eye}
            label="Store Views"
            value={analytics.allTime.views}
            color="text-blue-500"
          />
          <StatCard
            icon={MousePointerClick}
            label="Product Views"
            value={analytics.allTime.productViews}
            color="text-purple-500"
          />
          <StatCard
            icon={MessageCircle}
            label="WhatsApp Clicks"
            value={analytics.allTime.waClicks}
            color="text-whatsapp"
          />
        </div>
      </section>

      {/* Top products */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Top Products by WhatsApp Clicks
        </h2>
        {topProducts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No WhatsApp clicks recorded yet. Share your product links to start tracking.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">
                      {i + 1}
                    </span>
                    <TrendingUp className="w-4 h-4 text-whatsapp shrink-0" />
                    <span className="text-sm flex-1 font-medium text-foreground truncate">
                      {p.title}
                    </span>
                    <span className="text-sm font-semibold text-whatsapp shrink-0">
                      {p.clicks} click{p.clicks !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-2xl font-bold text-foreground">{value.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
