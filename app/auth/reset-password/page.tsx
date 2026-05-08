"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

type PageState = "loading" | "ready" | "success" | "invalid"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>("loading")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  useEffect(() => {
    // Hash never reaches the server — parse it client-side
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)

    const type = params.get("type")
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    if (type !== "recovery" || !accessToken || !refreshToken) {
      setPageState("invalid")
      return
    }

    // Establish the session from the recovery tokens
    const supabase = createClient()
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setPageState("invalid")
        } else {
          setPageState("ready")
        }
      })
  }, [])

  async function onSubmit(data: ResetPasswordInput) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setPageState("success")
    setTimeout(() => router.push("/auth/login"), 2000)
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
          <h1 className="text-2xl font-semibold text-foreground">Set new password</h1>
          <p className="text-muted-foreground text-sm">Choose a strong password for your account</p>
        </div>

        <Card className="border border-border shadow-sm">
          {pageState === "loading" && (
            <CardContent className="pt-6 pb-6 flex items-center justify-center gap-3 text-muted-foreground">
              <Spinner className="h-5 w-5" />
              <span className="text-sm">Verifying reset link...</span>
            </CardContent>
          )}

          {pageState === "invalid" && (
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <p className="text-sm font-medium text-destructive">Reset link is invalid or expired</p>
              <p className="text-xs text-muted-foreground">Reset links expire after 1 hour.</p>
              <Link
                href="/auth/forgot-password"
                className="block text-sm text-whatsapp font-medium hover:underline"
              >
                Request a new link
              </Link>
            </CardContent>
          )}

          {pageState === "success" && (
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-whatsapp/10 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-whatsapp" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Password updated!</p>
                <p className="text-sm text-muted-foreground mt-1">Redirecting to login...</p>
              </div>
            </CardContent>
          )}

          {pageState === "ready" && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
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
                    placeholder="Repeat your new password"
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
              <CardFooter className="pb-6">
                <Button
                  type="submit"
                  className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
