"use client"

import { useState } from "react"
import { useFieldArray, Controller, type Control } from "react-hook-form"
import type { StoreSettingsInput } from "@/lib/validations"
import { deleteCloudinaryImages } from "@/lib/actions/cloudinary"
import { ImageUploader } from "@/components/dashboard/ImageUploader"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Image as ImageIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const MAX_BANNERS = 3

const BG_PALETTE = [
  "bg-pink-50 border-pink-200",
  "bg-green-50 border-green-200",
  "bg-purple-50 border-purple-200",
]

interface BannerManagerProps {
  control: Control<StoreSettingsInput>
  storeSlug: string
  products: { id: string; title: string; slug: string }[]
  disabled?: boolean
}

export function BannerManager({
  control,
  storeSlug,
  products,
  disabled = false,
}: BannerManagerProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "banners" })
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (confirmIndex === null) return
    const field = fields[confirmIndex]
    setDeleting(true)
    // Remove from form array
    remove(confirmIndex)
    setConfirmIndex(null)
    setDeleting(false)
    // Fire-and-forget Cloudinary cleanup
    if (field.image_url) {
      deleteCloudinaryImages([field.image_url]).catch(() => {
        toast({ title: "Image could not be removed from storage", variant: "destructive" })
      })
    }
  }

  function handleAdd() {
    if (fields.length >= MAX_BANNERS) return
    append({
      id: crypto.randomUUID(),
      image_url: "",
      title: "",
      subtitle: "",
      link: "",
    })
  }

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-10 text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">No banners yet</p>
          <p className="text-xs">Add up to {MAX_BANNERS} hero banners for your store.</p>
        </div>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className={`rounded-lg border p-4 space-y-3 ${BG_PALETTE[index % BG_PALETTE.length]}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Banner {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setConfirmIndex(index)}
              disabled={disabled}
              title="Delete banner"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label className="text-xs">Banner Image (1200×400px)</Label>
            <Controller
              control={control}
              name={`banners.${index}.image_url`}
              render={({ field: f }) => (
                <ImageUploader
                  value={f.value ? [f.value] : []}
                  onChange={(urls) => f.onChange(urls[0] ?? "")}
                  preset="banner"
                  maxImages={1}
                  disabled={disabled}
                />
              )}
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor={`banner-title-${index}`}>
              Title
            </Label>
            <Controller
              control={control}
              name={`banners.${index}.title`}
              render={({ field: f }) => (
                <Input
                  id={`banner-title-${index}`}
                  placeholder="e.g. New Arrivals ✨"
                  disabled={disabled}
                  {...f}
                  value={f.value ?? ""}
                />
              )}
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor={`banner-subtitle-${index}`}>
              Subtitle
            </Label>
            <Controller
              control={control}
              name={`banners.${index}.subtitle`}
              render={({ field: f }) => (
                <Input
                  id={`banner-subtitle-${index}`}
                  placeholder="e.g. Fresh picks, just dropped"
                  disabled={disabled}
                  {...f}
                  value={f.value ?? ""}
                />
              )}
            />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor={`banner-link-${index}`}>
              Button Link
            </Label>
            <Controller
              control={control}
              name={`banners.${index}.link`}
              render={({ field: f }) => (
                <select
                  id={`banner-link-${index}`}
                  value={f.value ?? ""}
                  onChange={(e) => f.onChange(e.target.value)}
                  disabled={disabled}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No link (button hidden)</option>
                  <option value={`/s/${storeSlug}/products`}>All Products page</option>
                  {products.map((p) => (
                    <option key={p.id} value={`/s/${storeSlug}/${p.slug}`}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Link opens when visitors tap the button on this banner.
            </p>
          </div>
        </div>
      ))}

      {fields.length < MAX_BANNERS && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleAdd}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Add Banner {fields.length > 0 ? `(${fields.length}/${MAX_BANNERS})` : ""}
        </Button>
      )}

      <ConfirmDialog
        open={confirmIndex !== null}
        onOpenChange={(open) => !open && setConfirmIndex(null)}
        title="Delete banner?"
        description="This banner will be removed and its image deleted from storage. This cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
