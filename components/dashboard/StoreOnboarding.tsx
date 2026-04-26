"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { storeOnboardingSchema, type StoreOnboardingInput, generateSlug } from "@/lib/validations"
import { createStore } from "@/lib/actions/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export function StoreOnboarding() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StoreOnboardingInput>({
    resolver: zodResolver(storeOnboardingSchema),
    defaultValues: {
      name: "",
      whatsappNumber: "",
    },
  })

  const watchedName = watch("name")

  async function onSubmit(data: StoreOnboardingInput) {
    setLoading(true)
    setError(null)

    const result = await createStore(data)

    if (!result.success) {
      setError(result.error || "Failed to create store")
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <Card className="border border-border shadow-sm max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Set up your store</CardTitle>
        <CardDescription>
          Complete your store setup to start selling via WhatsApp.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Store Name</Label>
            <Input
              id="name"
              placeholder="e.g. Priya Boutique"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {watchedName && (
              <p className="text-xs text-muted-foreground">
                Your store URL: <span className="text-whatsapp font-medium">/s/{generateSlug(watchedName)}</span>
              </p>
            )}
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              placeholder="+919876543210"
              aria-invalid={!!errors.whatsappNumber}
              {...register("whatsappNumber")}
            />
            <p className="text-xs text-muted-foreground">
              International format with country code (e.g. +91 for India)
            </p>
            {errors.whatsappNumber && (
              <p className="text-sm text-destructive">{errors.whatsappNumber.message}</p>
            )}
          </div>
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pb-6">
          <Button
            type="submit"
            className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating store...
              </>
            ) : (
              "Create my store"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
