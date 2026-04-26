"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { isAdminUser } from "@/lib/supabase/roles"
import { loginSchema, type LoginInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check if user is admin and redirect accordingly
    const isAdmin = isAdminUser(authData.user)
    window.location.href = isAdmin ? "/admin" : "/dashboard"
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
          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your seller account</p>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
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
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-whatsapp font-medium hover:underline">
                  Sign up free
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
