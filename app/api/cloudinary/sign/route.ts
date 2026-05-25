import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CLOUDINARY_UPLOAD_LIMITS } from "@/lib/constants"

// SHA-1 using Web Crypto API (works in Node.js, Edge runtime, and Cloudflare Workers)
async function buildSignature(
  params: Record<string, string | number>,
  apiSecret: string
): Promise<string> {
  const paramString =
    Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&") + apiSecret

  const encoded = new TextEncoder().encode(paramString)
  const hashBuffer = await crypto.subtle.digest("SHA-1", encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[cloudinary/sign] Missing CLOUDINARY_* environment variables")
    return NextResponse.json(
      { error: "Upload service is not configured" },
      { status: 503 }
    )
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `microstore/${user.id}`

  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  }

  const signature = await buildSignature(paramsToSign, apiSecret)

  return NextResponse.json({
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: cloudName,
    folder,
  })
}
