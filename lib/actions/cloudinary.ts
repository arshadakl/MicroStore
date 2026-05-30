"use server"

import { createClient } from "@/lib/supabase/server"
import { extractCloudinaryPublicId } from "@/lib/cloudinary"

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

async function sha1Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest("SHA-1", encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Deletes one or more Cloudinary images by their stored secure_url.
 * Only deletes images in the authenticated user's own folder (microstore/{userId}/).
 * Failures are silently swallowed — DB record should be removed regardless.
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  const user = await getAuthenticatedUser()
  if (!user) return

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return

  const validUrls = urls.filter(Boolean)
  if (validUrls.length === 0) return

  await Promise.allSettled(
    validUrls.map(async (url) => {
      const publicId = extractCloudinaryPublicId(url)
      if (!publicId) return
      // Only delete images in this user's folder — prevents deletion of other users' assets
      if (!publicId.startsWith(`microstore/${user.id}`)) return

      const timestamp = Math.floor(Date.now() / 1000)
      const signature = await sha1Hex(
        `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
      )

      const body = new URLSearchParams({
        public_id: publicId,
        signature,
        api_key: apiKey,
        timestamp: String(timestamp),
      })

      await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        }
      )
    })
  )
}
