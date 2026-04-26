import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type EmailOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"
  const callbackError = searchParams.get("error")
  const callbackErrorDescription = searchParams.get("error_description")

  // If provider already returned an error, surface it in the auth error page.
  if (callbackError) {
    const errorUrl = new URL("/auth/error", origin)
    errorUrl.searchParams.set("error", callbackError)
    if (callbackErrorDescription) {
      errorUrl.searchParams.set("message", callbackErrorDescription)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const errorUrl = new URL("/auth/error", origin)
    errorUrl.searchParams.set("error", error.code ?? "verify_otp_failed")
    errorUrl.searchParams.set(
      "message",
      error.message ?? "Could not verify your email link."
    )
    return NextResponse.redirect(errorUrl.toString())
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const errorUrl = new URL("/auth/error", origin)
    errorUrl.searchParams.set("error", error.code ?? "exchange_failed")
    errorUrl.searchParams.set(
      "message",
      error.message ?? "Could not verify your email link."
    )
    return NextResponse.redirect(errorUrl.toString())
  }

  const errorUrl = new URL("/auth/error", origin)
  errorUrl.searchParams.set("error", "missing_code")
  errorUrl.searchParams.set(
    "message",
    "Verification link is invalid or incomplete (missing code)."
  )
  return NextResponse.redirect(errorUrl.toString())
}
