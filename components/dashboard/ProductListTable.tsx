"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { deleteProduct, toggleProductFeatured, toggleProductActive } from "@/lib/actions/product"
import { Product, Category } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Copy, ExternalLink, Package, Star, Eye, EyeOff, Search } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ProductListTableProps {
  products: Product[]
  storeSlug: string
  categories?: Category[]
}

export function ProductListTable({ products, storeSlug, categories = [] }: ProductListTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null)
  const [togglingActive, setTogglingActive] = useState<string | null>(null)

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of categories) m[c.id] = c.name
    return m
  }, [categories])

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.title.toLowerCase().includes(q))
  }, [products, search])

  async function handleDelete(id: string) {
    setDeleting(true)
    const result = await deleteProduct(id)
    setDeletingId(null)
    setDeleting(false)
    if (result.success) {
      toast({ title: "Product deleted" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    setTogglingFeatured(id)
    const result = await toggleProductFeatured(id, !current)
    setTogglingFeatured(null)
    if (result.success) {
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    setTogglingActive(id)
    const result = await toggleProductActive(id, !current)
    setTogglingActive(null)
    if (result.success) {
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/s/${storeSlug}/${slug}`
    navigator.clipboard.writeText(url)
    toast({ title: "Link copied!", description: "Share it on Instagram or WhatsApp." })
  }

  if (products.length === 0) {
    return (
      <Empty className="py-20">
        <EmptyMedia variant="icon">
          <Package className="w-8 h-8 text-muted-foreground/50" />
        </EmptyMedia>
        <EmptyTitle>No products yet</EmptyTitle>
        <EmptyDescription>Add your first product to start selling.</EmptyDescription>
        <Button asChild className="bg-whatsapp hover:bg-whatsapp-dark text-white mt-2">
          <Link href="/dashboard/products/new">Add product</Link>
        </Button>
      </Empty>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No products match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                {categories.length > 0 && (
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Category
                  </th>
                )}
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                          {product.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          /s/{storeSlug}/{product.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {categories.length > 0 && (
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {product.category_id && categoryMap[product.category_id] ? (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          {categoryMap[product.category_id]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-3 font-medium text-foreground">
                    &#8377;{Number(product.price).toLocaleString("en-IN")}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleToggleFeatured(product.id, product.is_featured)}
                        disabled={togglingFeatured === product.id}
                        className="inline-flex"
                        title={product.is_featured ? "Remove from featured" : "Mark as featured"}
                      >
                        {togglingFeatured === product.id ? (
                          <Spinner className="w-3.5 h-3.5" />
                        ) : (
                          <Badge
                            variant="secondary"
                            className={`gap-1 cursor-pointer transition-opacity ${
                              product.is_featured
                                ? "text-amber-600 bg-amber-50 border-amber-200 hover:opacity-70"
                                : "text-muted-foreground/40 bg-transparent border-dashed border-muted-foreground/20 hover:opacity-70"
                            }`}
                          >
                            <Star className="w-3 h-3" />
                            {product.is_featured ? "Featured" : "Feature"}
                          </Badge>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleActive(product.id, product.is_active)}
                        disabled={togglingActive === product.id}
                        className="inline-flex"
                        title={product.is_active ? "Hide product" : "Show product"}
                      >
                        {togglingActive === product.id ? (
                          <Spinner className="w-3.5 h-3.5" />
                        ) : product.is_active ? (
                          <Badge
                            variant="outline"
                            className="cursor-pointer text-green-700 bg-green-50 border-green-200 hover:opacity-70"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="cursor-pointer text-gray-600 bg-gray-50 border-gray-200 hover:opacity-70"
                          >
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyLink(product.slug)}
                        title="Copy link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        title="View product"
                      >
                        <a
                          href={`/s/${storeSlug}/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        title="Edit"
                      >
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(product.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed from your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={deleting}
            >
              {deleting && <Spinner className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
