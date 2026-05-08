import { createHash } from "crypto"

function extractPublicId(url: string): string | null {
  // Cloudinary URLs: https://res.cloudinary.com/{cloud}/image/upload/v{ver}/{folder/public_id}.{ext}
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
  return match?.[1] ?? null
}

function buildDestroySignature(
  publicId: string,
  timestamp: number,
  apiSecret: string
): string {
  const paramString = `public_id=${publicId}&timestamp=${timestamp}`
  return createHash("sha1").update(paramString + apiSecret).digest("hex")
}

export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  if (!urls.length) return

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[cloudinary-server] Missing CLOUDINARY_* env vars — skipping deletion")
    return
  }

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const publicId = extractPublicId(url)
      if (!publicId) return

      const timestamp = Math.floor(Date.now() / 1000)
      const signature = buildDestroySignature(publicId, timestamp, apiSecret)

      const body = new URLSearchParams({
        public_id: publicId,
        api_key: apiKey,
        timestamp: String(timestamp),
        signature,
      })

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        { method: "POST", body }
      )

      if (!res.ok) {
        const text = await res.text()
        console.error(`[cloudinary-server] Failed to delete ${publicId}:`, text)
      }
    })
  )

  const failed = results.filter((r) => r.status === "rejected")
  if (failed.length) {
    console.error(`[cloudinary-server] ${failed.length} deletion(s) failed`)
  }
}
