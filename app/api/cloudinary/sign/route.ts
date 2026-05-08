import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CLOUDINARY_UPLOAD_LIMITS } from "@/lib/constants"

// Cloudinary signature: SHA1(sorted_params_string + api_secret)
// https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
function buildSignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const paramString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&")

  return createHash("sha1")
    .update(paramString + apiSecret)
    .digest("hex")
}

export async function POST() {
  // 1. Verify the caller is an authenticated seller
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Guard against missing server config — fail closed, not open
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

  // 3. Build upload params that are locked into the signature.
  //    Cloudinary will reject requests that deviate from these constraints.
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `microstore/${user.id}` // scope storage per seller

  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  }

  const signature = buildSignature(paramsToSign, apiSecret)

  return NextResponse.json({
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: cloudName,
    folder,
  })
}
