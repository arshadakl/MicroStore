import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getAllUsers } from "@/lib/actions/admin"
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
import type { StoreStatus } from "@/types"
import { Users } from "lucide-react"

function formatRelativeTime(isoString: string | null): { label: string; isOnline: boolean } {
  if (!isoString) return { label: "Never", isOnline: false }
  const diff = Date.now() - new Date(isoString).getTime()
  const isOnline = diff < 5 * 60 * 1000
  if (isOnline) return { label: "Online", isOnline: true }
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return { label: `${mins}m ago`, isOnline: false }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { label: `${hours}h ago`, isOnline: false }
  const days = Math.floor(hours / 24)
  if (days < 30) return { label: `${days}d ago`, isOnline: false }
  const months = Math.floor(days / 30)
  return { label: `${months}mo ago`, isOnline: false }
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { users, error } = await getAllUsers()

  if (error || !users) {
    return (
      <div className="px-4 py-6 sm:p-8 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <p className="text-destructive">Failed to load users: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">All Users</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Registered sellers ({users.length} total)
        </p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Store Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Categories</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="w-8 h-8 opacity-40" />
                      <p>No users yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const { label: activityLabel, isOnline } = formatRelativeTime(u.lastSignIn)
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">{u.email}</span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isOnline ? "bg-green-500" : "bg-muted-foreground/40"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              isOnline ? "text-green-600 font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {activityLabel}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(u.joinedAt).toLocaleDateString()}
                        </span>
                      </TableCell>

                      <TableCell>
                        {u.store ? (
                          <div className="min-w-0">
                            <Link
                              href={`/admin/stores/${u.store.id}`}
                              className="text-sm font-medium text-foreground hover:underline truncate block"
                            >
                              {u.store.name}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate">
                              /s/{u.store.slug}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No store</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {u.store ? (
                          <StoreStatusBadge
                            status={u.store.status as StoreStatus}
                            isBlocked={u.store.isBlocked}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-foreground">
                          {u.store ? u.store.productCount : "-"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-foreground">
                          {u.store ? u.store.categoryCount : "-"}
                        </span>
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
