"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { signUpSchema, type SignUpInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      storeName: "",
      whatsappNumber: "",
    },
  })

  async function onSubmit(data: SignUpInput) {
    setLoading(true)
    setError(null)

    const customDevRedirect = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.trim()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
    const callbackBaseUrl = appUrl && appUrl.startsWith("http")
      ? appUrl
      : window.location.origin
    const emailRedirectTo = customDevRedirect || callbackBaseUrl

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo,
        data: {
          role: "seller",
          pending_store_name: data.storeName,
          pending_whatsapp_number: data.whatsappNumber,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSubmittedEmail(data.email)
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-whatsapp/10 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-whatsapp" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Check your email</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We sent a confirmation link to <strong className="text-foreground">{submittedEmail}</strong>. Click it to activate your account.
          </p>
          <Link href="/auth/login" className="text-sm text-whatsapp hover:underline inline-block">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-whatsapp flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="font-semibold text-foreground text-lg">MicroStore</span>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Create your store</h1>
          <p className="text-muted-foreground text-sm">Create your store and start selling on WhatsApp.</p>
        </div>

        <Card className="border border-border shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  type="text"
                  placeholder="My Awesome Store"
                  aria-invalid={!!errors.storeName}
                  {...register("storeName")}
                />
                {errors.storeName && (
                  <p className="text-sm text-destructive">{errors.storeName.message}</p>
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
                  International format with country code (e.g., +91 for India)
                </p>
                {errors.whatsappNumber && (
                  <p className="text-sm text-destructive">{errors.whatsappNumber.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-6">
              <Button
                type="submit"
                className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-whatsapp font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
