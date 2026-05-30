/**
 * Applies Cloudinary URL transformations (resize + format + quality) to a stored image URL.
 * Reduces image payload 60-80% on mobile — no Next.js Image optimization needed.
 *
 * @param url     Raw Cloudinary secure_url from DB
 * @param width   Target width in px (default 400 — fits 2-col product grid)
 * @param quality JPEG/WebP quality 1-100 (default 80)
 */
export function cloudinaryResize(url: string, width = 400, quality = 80): string {
  if (!url?.includes("res.cloudinary.com")) return url
  return url.replace("/upload/", `/upload/w_${width},q_${quality},f_auto,c_fill/`)
}

/**
 * Extracts the Cloudinary public_id from a stored secure_url.
 * Handles URLs with or without transform segments and version prefixes.
 * Returns null if the URL is not a Cloudinary URL.
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url?.includes("res.cloudinary.com")) return null
  const uploadIdx = url.indexOf("/upload/")
  if (uploadIdx === -1) return null
  let rest = url.slice(uploadIdx + 8)
  // Strip transform segment (contains commas) e.g. "w_400,q_80,f_auto,c_fill/"
  if (/^[a-z_,0-9]+\//.test(rest)) rest = rest.replace(/^[^/]+\//, "")
  // Strip version prefix e.g. "v1234567890/"
  rest = rest.replace(/^v\d+\//, "")
  // Strip file extension
  rest = rest.replace(/\.[a-z0-9]+$/i, "")
  return rest || null
}

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
}

export interface SignPayload {
  signature: string
  timestamp: number
  api_key: string
  cloud_name: string
  folder: string
}

/** Fetch a short-lived signed upload token from the server. Call this early (before crop) to hide latency. */
export async function getUploadSignature(): Promise<SignPayload> {
  const res = await fetch("/api/cloudinary/sign", { method: "POST" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? "Failed to get upload signature")
  }
  return res.json()
}

/** Upload a file to Cloudinary using an already-fetched signature. */
export async function uploadWithSignature(
  file: File,
  sign: SignPayload
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", sign.api_key)
  formData.append("timestamp", String(sign.timestamp))
  formData.append("signature", sign.signature)
  formData.append("folder", sign.folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloud_name}/image/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { error?: { message?: string } }).error?.message ?? "Upload to Cloudinary failed"
    )
  }

  return res.json() as Promise<CloudinaryUploadResult>
}

/** Convenience: sign + upload in one call. */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const sign = await getUploadSignature()
  return uploadWithSignature(file, sign)
}
