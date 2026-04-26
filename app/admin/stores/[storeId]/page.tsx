import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getStoreWithProducts } from "@/lib/actions/admin"
import { getTrialDaysRemaining } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import {
  ArrowLeft,
  ExternalLink,
  Package,
  MessageCircle,
  Calendar,
  Clock,
  Star,
} from "lucide-react"

interface StoreDetailPageProps {
  params: Promise<{ storeId: string }>
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { storeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { store, products, error } = await getStoreWithProducts(storeId)

  if (error || !store) {
    notFound()
  }

  const trialDays = store.status === "trial" 
    ? getTrialDaysRemaining(store.trial_ends_at) 
    : null

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/stores">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{store.name}</h1>
              <StoreStatusBadge status={store.status} isBlocked={store.is_blocked} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">/s/{store.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Store
            </a>
          </Button>
          <AdminStoreActions store={store} />
        </div>
      </div>

      {/* Store Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-whatsapp" />
              <span className="text-sm font-medium text-foreground">{store.whatsapp_number}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground">{products?.length ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {store.status === "trial" ? "Trial Ends" : "Created"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {store.status === "trial" ? (
                <>
                  <Clock className={`w-4 h-4 ${trialDays !== null && trialDays <= 3 ? "text-amber-500" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${trialDays !== null && trialDays <= 3 ? "text-amber-600" : "text-foreground"}`}>
                    {trialDays !== null && trialDays > 0 
                      ? `${trialDays} days left`
                      : "Expired"
                    }
                  </span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {new Date(store.created_at).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Products ({products?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="w-8 h-8 opacity-40" />
                      <p>No products yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground truncate">/{product.slug}</p>
                        </div>
                        {product.is_featured && (
                          <Star className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">
                        &#8377;{product.price.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={product.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
