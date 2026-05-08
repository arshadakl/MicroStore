"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { storeOnboardingSchema, type StoreOnboardingInput, generateSlug } from "@/lib/validations"
import { createStore } from "@/lib/actions/store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export function OnboardingModal() {
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
    defaultValues: { name: "", whatsappNumber: "" },
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

    router.push("/dashboard")
  }

  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-md"
        // prevent closing — user must complete onboarding
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-whatsapp flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">MicroStore</span>
          </div>
          <DialogTitle className="text-xl">Set up your store</DialogTitle>
          <DialogDescription>
            One last step — tell us about your store and WhatsApp number so customers can reach you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="onboard-name">Store Name</Label>
            <Input
              id="onboard-name"
              placeholder="e.g. Priya Boutique"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {watchedName && (
              <p className="text-xs text-muted-foreground">
                Store URL:{" "}
                <span className="text-whatsapp font-medium">/s/{generateSlug(watchedName)}</span>
              </p>
            )}
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="onboard-whatsapp">WhatsApp Number</Label>
            <Input
              id="onboard-whatsapp"
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
