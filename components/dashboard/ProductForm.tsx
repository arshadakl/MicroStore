"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, type ProductInput, generateSlug } from "@/lib/validations"
import { createProduct, updateProduct } from "@/lib/actions/product"
import { Product, Category } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ImageUploader } from "@/components/dashboard/ImageUploader"
import { ShoppingBag, Eye, ImageIcon } from "lucide-react"
import Link from "next/link"

interface ProductFormProps {
  product?: Product
  categories?: Category[]
  storeSlug?: string
}

export function ProductForm({ product, categories = [], storeSlug }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title ?? "",
      price: product?.price ?? 0,
      description: product?.description ?? "",
      images: product?.images ?? [],
      isFeatured: product?.is_featured ?? false,
      isActive: product?.is_active ?? true,
      categoryId: product?.category_id ?? null,
    },
  })

  const watchedTitle = watch("title")
  const watchedPrice = watch("price")
  const watchedDescription = watch("description")
  const watchedImages = watch("images") ?? []
  const watchedIsFeatured = watch("isFeatured")
  const watchedIsActive = watch("isActive")
  const watchedCategoryId = watch("categoryId")

  async function onSubmit(data: ProductInput) {
    setLoading(true)
    setError(null)

    const result = isEditing && product
      ? await updateProduct(product.id, data)
      : await createProduct(data)

    if (!result.success) {
      setError(result.error || "Failed to save product")
      setLoading(false)
      return
    }

    router.push("/dashboard/products")
    router.refresh()
  }

  const previewPrice = Number(watchedPrice) || 0

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ── Left column ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-whatsapp/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-whatsapp" />
                </div>
                <div>
                  <CardTitle className="text-base">Product Information</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title">
                  Product Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Red Silk Saree"
                  aria-invalid={!!errors.title}
                  {...register("title")}
                />
                <div className="flex justify-between items-center">
                  {watchedTitle ? (
                    <p className="text-xs text-muted-foreground">
                      Slug: <span className="text-whatsapp font-medium">{generateSlug(watchedTitle)}</span>
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">{(watchedTitle ?? "").length}/200</span>
                </div>
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <Label htmlFor="price">
                  Price (INR) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0.00"
                    className="pl-7"
                    aria-invalid={!!errors.price}
                    {...register("price", { valueAsNumber: true })}
                  />
                </div>
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product, its features, material, size, etc."
                  rows={4}
                  className="resize-none"
                  aria-invalid={!!errors.description}
                  {...register("description")}
                />
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">{(watchedDescription ?? "").length}/2000</span>
                </div>
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label>
                  Category {categories.length > 0 && <span className="text-destructive">*</span>}
                </Label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Select
                      value={watchedCategoryId ?? "none"}
                      onValueChange={(val) =>
                        setValue("categoryId", val === "none" ? null : val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Link
                    href="/dashboard/categories"
                    className="text-sm text-whatsapp hover:underline shrink-0 pt-2"
                  >
                    Manage categories
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">Helps customers find your product faster.</p>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Images */}
              <div className="space-y-1.5">
                <Label>Product Images</Label>
                <ImageUploader
                  value={watchedImages}
                  onChange={(urls) => setValue("images", urls, { shouldValidate: true })}
                  preset="product"
                  disabled={loading}
                />
                {errors.images && (
                  <p className="text-sm text-destructive">{errors.images.message}</p>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">

          {/* Visibility */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Visibility</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Control how your product appears in your store.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Featured Product</p>
                  <p className="text-xs text-muted-foreground">Show on store homepage</p>
                </div>
                <Switch
                  checked={watchedIsFeatured}
                  onCheckedChange={(checked) => setValue("isFeatured", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Product is visible on storefront</p>
                </div>
                <Switch
                  checked={watchedIsActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Product Preview</CardTitle>
                {product && storeSlug && (
                  <Link
                    href={`/s/${storeSlug}/${product.slug}`}
                    target="_blank"
                    className="text-xs text-whatsapp hover:underline"
                  >
                    Preview
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-xl overflow-hidden">
                {/* Image preview */}
                <div className="relative aspect-square bg-muted/50 border-t border-b border-border">
                  {watchedImages[0] ? (
                    <img
                      src={watchedImages[0]}
                      alt={watchedTitle || "Product"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4 space-y-1.5">
                  <p className="font-semibold text-foreground text-sm leading-snug">
                    {watchedTitle || "Product Title"}
                  </p>
                  <p className="text-lg font-bold text-whatsapp">
                    ₹{previewPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  {watchedDescription ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">{watchedDescription}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic">Short product description will appear here...</p>
                  )}
                  <div className="pt-1">
                    {watchedIsActive ? (
                      <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 text-xs">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs">Inactive</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            className="bg-whatsapp hover:bg-whatsapp-dark text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Save changes" : "Create Product"
            )}
          </Button>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setValue("isActive", false)
                handleSubmit(onSubmit)()
              }}
            >
              Save as Draft
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
