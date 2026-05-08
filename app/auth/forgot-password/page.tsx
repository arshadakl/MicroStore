"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-whatsapp flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="font-semibold text-foreground text-lg">MicroStore</span>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Forgot password?</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        {sent ? (
          <Card className="border border-border shadow-sm">
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-whatsapp/10 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-whatsapp" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Check your email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Reset link sent to <span className="font-medium">{getValues("email")}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive it? Check spam or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-whatsapp hover:underline font-medium"
                >
                  try again
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
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
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Remember it?{" "}
                  <Link href="/auth/login" className="text-whatsapp font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}
