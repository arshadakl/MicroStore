"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const errorCode = searchParams.get("error")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm px-4">
        <h1 className="text-2xl font-semibold text-foreground">Authentication Error</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {message || "Something went wrong during sign in. Please try again."}
        </p>
        {errorCode && (
          <p className="text-xs text-muted-foreground">Error code: {errorCode}</p>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed">
          If this happened after email verification, confirm your Redirect URLs in Supabase include
          your current callback URL.
        </p>
        <Button asChild className="w-full">
          <Link href="/auth/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  )
}
