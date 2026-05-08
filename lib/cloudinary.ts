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
