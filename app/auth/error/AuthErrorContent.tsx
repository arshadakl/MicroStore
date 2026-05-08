"use client"

import { useSearchParams } from "next/navigation"

export function AuthErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const errorCode = searchParams.get("error")

  return (
    <>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {message || "Something went wrong during sign in. Please try again."}
      </p>
      {errorCode && (
        <p className="text-xs text-muted-foreground">Error code: {errorCode}</p>
      )}
    </>
  )
}
