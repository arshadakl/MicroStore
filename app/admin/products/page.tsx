import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getAllProducts } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package, Star, ExternalLink } from "lucide-react"

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { products, error } = await getAllProducts()

  if (error || !products) {
    return (
      <div className="px-4 py-6 sm:p-8 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <p className="text-destructive">Failed to load products: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">All Products</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Browse all products across all stores ({products.length} total)
        </p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
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
                          <p className="font-medium text-foreground truncate max-w-[200px]">
                            {product.title}
                          </p>
                        </div>
                        {product.is_featured && (
                          <Star className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.store ? (
                        <Link
                          href={`/admin/stores/${product.store.id}`}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {product.store.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">
                        &#8377;{product.price.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={product.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.store && (
                        <a
                          href={`/s/${product.store.slug}/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
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
