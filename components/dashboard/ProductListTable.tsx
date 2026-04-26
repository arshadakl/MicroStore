"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { deleteProduct } from "@/lib/actions/product"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Pencil, Trash2, Copy, ExternalLink, Package, Star, Eye, EyeOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ProductListTableProps {
  products: Product[]
  storeSlug: string
}

export function ProductListTable({ products, storeSlug }: ProductListTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleDelete(id: string) {
    setLoading(true)
    const result = await deleteProduct(id)
    setDeletingId(null)
    setLoading(false)

    if (result.success) {
      toast({ title: "Product deleted", description: "The product has been removed." })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete product",
        variant: "destructive",
      })
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
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
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
                    <div>
                      <p className="font-medium text-foreground">{product.title}</p>
                      <p className="text-xs text-muted-foreground">/s/{storeSlug}/{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  &#8377;{product.price.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {product.is_featured && (
                      <Badge variant="secondary" className="gap-1 text-amber-600 bg-amber-50 border-amber-200">
                        <Star className="w-3 h-3" />
                        Featured
                      </Badge>
                    )}
                    {product.is_active ? (
                      <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                        <Eye className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Hidden
                      </Badge>
                    )}
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
                      <a href={`/s/${storeSlug}/${product.slug}`} target="_blank" rel="noopener noreferrer">
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
