"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, type ProductInput, generateSlug } from "@/lib/validations"
import { createProduct, updateProduct } from "@/lib/actions/product"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface ProductFormProps {
  storeId: string
  product?: Product
}

export function ProductForm({ storeId, product }: ProductFormProps) {
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
    },
  })

  const watchedTitle = watch("title")
  const watchedIsFeatured = watch("isFeatured")
  const watchedIsActive = watch("isActive")

  // Handle images textarea separately
  const [imagesText, setImagesText] = useState(product?.images?.join("\n") ?? "")

  async function onSubmit(data: ProductInput) {
    setLoading(true)
    setError(null)

    // Parse images from textarea
    const imageList = imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    const payload: ProductInput = {
      ...data,
      images: imageList,
    }

    const result = isEditing && product
      ? await updateProduct(product.id, payload)
      : await createProduct(payload)

    if (!result.success) {
      setError(result.error || "Failed to save product")
      setLoading(false)
      return
    }

    router.push("/dashboard/products")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
          <CardDescription>
            {isEditing ? "Update your product information" : "Add a new product to your store"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Product Title</Label>
            <Input
              id="title"
              placeholder="e.g. Red Silk Saree"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {watchedTitle && (
              <p className="text-xs text-muted-foreground">
                Slug: <span className="text-whatsapp font-medium">{generateSlug(watchedTitle)}</span>
              </p>
            )}
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Price (INR)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1299"
              aria-invalid={!!errors.price}
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your product..."
              rows={4}
              className="resize-none"
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            <p className="text-xs text-muted-foreground">Max 2000 characters</p>
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="images">Image URLs</Label>
            <Textarea
              id="images"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              rows={3}
              className="resize-none font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              One HTTPS URL per line. Max 10 images.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="featured" className="text-sm font-medium">Featured product</Label>
              <p className="text-xs text-muted-foreground">Show on store homepage</p>
            </div>
            <Switch
              id="featured"
              checked={watchedIsFeatured}
              onCheckedChange={(checked) => setValue("isFeatured", checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="active" className="text-sm font-medium">Active</Label>
              <p className="text-xs text-muted-foreground">Product is visible on storefront</p>
            </div>
            <Switch
              id="active"
              checked={watchedIsActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

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
            isEditing ? "Save changes" : "Create product"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
