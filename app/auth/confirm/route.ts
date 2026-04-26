import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type EmailOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

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

  const errorUrl = new URL("/auth/error", origin)
  errorUrl.searchParams.set("error", "missing_token_hash")
  errorUrl.searchParams.set(
    "message",
    "Verification link is invalid or incomplete (missing token hash)."
  )
  return NextResponse.redirect(errorUrl.toString())
}
