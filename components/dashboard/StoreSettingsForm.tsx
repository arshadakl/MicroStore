"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { storeSettingsSchema, type StoreSettingsInput } from "@/lib/validations"
import { updateStore } from "@/lib/actions/store"
import { getAllThemes } from "@/lib/themes"
import type { Store } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"
import { ImageUploader } from "@/components/dashboard/ImageUploader"
import { BannerManager } from "@/components/dashboard/BannerManager"

interface StoreSettingsFormProps {
  store: Store
  products?: { id: string; title: string; slug: string }[]
}

export function StoreSettingsForm({ store, products = [] }: StoreSettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<StoreSettingsInput>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: store.name,
      whatsappNumber: store.whatsapp_number,
      tagline: store.tagline ?? "",
      logoUrl: store.logo_url ?? "",
      banners: store.banners ?? [],
      themeId: store.theme_id,
    },
  })

  const watchedTheme = watch("themeId")
  const watchedLogoUrl = watch("logoUrl") ?? ""

  async function onSubmit(data: StoreSettingsInput) {
    setLoading(true)
    const result = await updateStore(store.id, data)
    setLoading(false)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error || "Failed to save settings",
        variant: "destructive",
      })
      return
    }

    toast({ title: "Settings saved!", description: "Your store has been updated." })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store Info</CardTitle>
          <CardDescription>Basic information about your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Store Name</Label>
            <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline (optional)</Label>
            <Input
              id="tagline"
              placeholder="Your store slogan"
              aria-invalid={!!errors.tagline}
              {...register("tagline")}
            />
            <p className="text-xs text-muted-foreground">Max 150 characters</p>
            {errors.tagline && (
              <p className="text-sm text-destructive">{errors.tagline.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              aria-invalid={!!errors.whatsappNumber}
              {...register("whatsappNumber")}
            />
            <p className="text-xs text-muted-foreground">
              International format (e.g. +919876543210)
            </p>
            {errors.whatsappNumber && (
              <p className="text-sm text-destructive">{errors.whatsappNumber.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
          <CardDescription>Logo for your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Logo (optional)</Label>
            <ImageUploader
              value={watchedLogoUrl ? [watchedLogoUrl] : []}
              onChange={(urls) => setValue("logoUrl", urls[0] ?? "", { shouldValidate: true })}
              preset="logo"
              maxImages={1}
              disabled={loading}
            />
            {errors.logoUrl && (
              <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banners</CardTitle>
          <CardDescription>Hero banners shown at the top of your store (up to 3)</CardDescription>
        </CardHeader>
        <CardContent>
          <BannerManager
            control={control}
            storeSlug={store.slug}
            products={products}
            disabled={loading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store Theme</CardTitle>
          <CardDescription>Choose a visual style for your storefront</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={watchedTheme}
            onValueChange={(val) => setValue("themeId", val)}
            className="space-y-3"
          >
            {getAllThemes().map((theme) => (
              <div
                key={theme.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  watchedTheme === theme.id
                    ? "border-whatsapp bg-whatsapp/5"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <RadioGroupItem value={theme.id} id={theme.id} />
                <div className="flex-1">
                  <Label htmlFor={theme.id} className="cursor-pointer font-medium text-foreground">
                    {theme.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </div>
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: theme.primaryColor }}
                  title={`Primary color: ${theme.primaryColor}`}
                />
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          className="bg-whatsapp hover:bg-whatsapp-dark text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            "Save settings"
          )}
        </Button>
      </div>
    </form>
  )
}
