import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getAllStores } from "@/lib/actions/admin"
import { getTrialDaysRemaining, getSubscriptionDaysRemaining } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { ExternalLink, Store, Trash2 } from "lucide-react"

interface AdminStoresPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminStoresPage({ searchParams }: AdminStoresPageProps) {
  const { tab } = await searchParams
  const isTrashed = tab === "trash"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { stores, error } = await getAllStores(isTrashed)

  if (error || !stores) {
    return (
      <div className="px-4 py-6 sm:p-8 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <p className="text-destructive">Failed to load stores: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {isTrashed ? "Trashed Stores" : "All Stores"}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {isTrashed
            ? `Stores pending deletion (${stores.length})`
            : `Manage all seller stores (${stores.length} total)`}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-border">
        <Link
          href="/admin/stores"
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            !isTrashed
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active
        </Link>
        <Link
          href="/admin/stores?tab=trash"
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            isTrashed
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Trash
        </Link>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                {!isTrashed && <TableHead>Status</TableHead>}
                <TableHead>Products</TableHead>
                <TableHead>{isTrashed ? "Deleted On" : "Subscription / Trial"}</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isTrashed ? 5 : 6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {isTrashed ? (
                        <>
                          <Trash2 className="w-8 h-8 opacity-40" />
                          <p>Trash is empty</p>
                        </>
                      ) : (
                        <>
                          <Store className="w-8 h-8 opacity-40" />
                          <p>No stores yet</p>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => {
                  const trialDays =
                    store.status === "trial"
                      ? getTrialDaysRemaining(store.trial_ends_at)
                      : null

                  const subDays =
                    store.status === "active" && store.subscription_ends_at
                      ? getSubscriptionDaysRemaining(store.subscription_ends_at)
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
                            <p className="text-xs text-muted-foreground truncate">/s/{store.slug}</p>
                          </div>
                        </div>
                      </TableCell>

                      {!isTrashed && (
                        <TableCell>
                          <StoreStatusBadge status={store.status} isBlocked={store.is_blocked} />
                        </TableCell>
                      )}

                      <TableCell>
                        <span className="text-sm text-foreground">
                          {store.products?.[0]?.count ?? 0}
                        </span>
                      </TableCell>

                      <TableCell>
                        {isTrashed ? (
                          <span className="text-sm text-muted-foreground">
                            {store.deleted_at
                              ? new Date(store.deleted_at).toLocaleDateString()
                              : "-"}
                          </span>
                        ) : trialDays !== null ? (
                          <div className="text-sm">
                            <span
                              className={
                                trialDays <= 3
                                  ? "text-amber-600 font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              Trial:{" "}
                              {trialDays > 0
                                ? `${trialDays}d left`
                                : trialDays === 0
                                ? "expires today"
                                : "expired"}
                            </span>
                          </div>
                        ) : subDays !== null ? (
                          <div className="text-sm">
                            <span
                              className={
                                subDays <= 3 ? "text-amber-600 font-medium" : "text-muted-foreground"
                              }
                            >
                              Sub: {subDays > 0 ? `${subDays}d left` : "expired"}
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
                        <div className="flex items-center gap-1">
                          {!isTrashed && (
                            <a
                              href={`/s/${store.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title="View storefront"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <AdminStoreActions store={store} />
                        </div>
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
