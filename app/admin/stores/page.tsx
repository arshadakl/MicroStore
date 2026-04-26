import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getAllStores } from "@/lib/actions/admin"
import { getTrialDaysRemaining } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StoreStatusBadge } from "@/components/admin/StoreStatusBadge"
import { AdminStoreActions } from "@/components/admin/AdminStoreActions"
import { ExternalLink, Store } from "lucide-react"

export default async function AdminStoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { stores, error } = await getAllStores()

  if (error || !stores) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <p className="text-destructive">Failed to load stores: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">All Stores</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage all seller stores ({stores.length} total)
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Store className="w-8 h-8 opacity-40" />
                      <p>No stores yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => {
                  const trialDays = store.status === "trial" 
                    ? getTrialDaysRemaining(store.trial_ends_at) 
                    : null

                  return (
                    <TableRow key={store.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-muted-foreground">
                              {store.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <Link 
                              href={`/admin/stores/${store.id}`}
                              className="font-medium text-foreground hover:underline truncate block"
                            >
                              {store.name}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate">
                              /s/{store.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StoreStatusBadge status={store.status} isBlocked={store.is_blocked} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {store.products?.[0]?.count ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {store.trial_ends_at ? (
                          <div className="text-sm">
                            <span className={trialDays !== null && trialDays <= 3 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                              {trialDays !== null && trialDays > 0 
                                ? `${trialDays} days left`
                                : trialDays === 0 
                                  ? "Expires today"
                                  : "Expired"
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(store.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <AdminStoreActions store={store} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
