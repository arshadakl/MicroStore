"use client"

import { useRef, useState, useCallback } from "react"
import { X, CloudUpload, Loader2, AlertCircle } from "lucide-react"
import { getUploadSignature, uploadWithSignature, type SignPayload } from "@/lib/cloudinary"
import { CropModal } from "@/components/dashboard/CropModal"
import { CLOUDINARY_UPLOAD_LIMITS, PRODUCT_LIMITS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ── Preset crop configs ────────────────────────────────────────
export type UploadPreset = "product" | "logo" | "banner"

const PRESETS: Record<UploadPreset, {
  aspectRatio: number
  outputWidth: number
  outputHeight: number
  cropShape: "rect" | "round"
  hint: string
}> = {
  product: { aspectRatio: 1,   outputWidth: 800,  outputHeight: 800,  cropShape: "rect",  hint: "Square · 800×800px" },
  logo:    { aspectRatio: 1,   outputWidth: 400,  outputHeight: 400,  cropShape: "round", hint: "Square · 400×400px" },
  banner:  { aspectRatio: 3,   outputWidth: 1200, outputHeight: 400,  cropShape: "rect",  hint: "Wide · 1200×400px" },
}

interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  preset?: UploadPreset
  maxImages?: number
  disabled?: boolean
}

type PendingFile = {
  localId: string
  previewUrl: string        // object URL of original (for cropper)
  signPromise: Promise<SignPayload> // started immediately on file select
  status: "cropping" | "uploading" | "error"
  error?: string
}

type ConfirmedImage = { url: string }

export function ImageUploader({
  value,
  onChange,
  preset = "product",
  maxImages = PRODUCT_LIMITS.MAX_IMAGES_PER_PRODUCT,
  disabled = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const config = PRESETS[preset]
  const uploadingCount = pending.filter((u) => u.status === "uploading").length
  const canAdd = value.length + uploadingCount < maxImages && !disabled

  // ── File selection ─────────────────────────────────────────
  function openFile() {
    if (canAdd) fileInputRef.current?.click()
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Capture array BEFORE clearing — FileList is live and clears with value reset
    const rawFiles = Array.from(e.target.files ?? [])
    e.target.value = ""
    startPending(rawFiles)
  }

  function startPending(rawFiles: File[]) {
    const slots = maxImages - value.length - uploadingCount
    const files = rawFiles.filter((f) => f.type.startsWith("image/")).slice(0, slots)
    if (files.length === 0) return

    const entries: PendingFile[] = files.map((file) => ({
      localId: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      // ★ Start sign fetch immediately — hidden behind crop dialog
      signPromise: getUploadSignature(),
      status: "cropping",
    }))

    setPending((prev) => [...prev, ...entries])
  }

  // ── Drag & drop ────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!canAdd) return
    startPending(Array.from(e.dataTransfer.files))
  }, [canAdd]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Crop confirmed → upload ────────────────────────────────
  async function handleCropConfirm(localId: string, croppedFile: File) {
    const entry = pending.find((p) => p.localId === localId)
    if (!entry) return

    // Release the original object URL
    URL.revokeObjectURL(entry.previewUrl)

    setPending((prev) =>
      prev.map((p) => p.localId === localId ? { ...p, status: "uploading" } : p)
    )

    try {
      // Sign promise was started at file-select time — likely already resolved
      const sign = await entry.signPromise
      const result = await uploadWithSignature(croppedFile, sign)
      onChange([...value, result.secure_url])
      setPending((prev) => prev.filter((p) => p.localId !== localId))
    } catch (err) {
      setPending((prev) =>
        prev.map((p) =>
          p.localId === localId
            ? { ...p, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
            : p
        )
      )
    }
  }

  function handleCropCancel(localId: string) {
    setPending((prev) => {
      const entry = prev.find((p) => p.localId === localId)
      if (entry) URL.revokeObjectURL(entry.previewUrl)
      return prev.filter((p) => p.localId !== localId)
    })
  }

  function removeConfirmed(url: string) {
    onChange(value.filter((u) => u !== url))
  }

  function dismissError(localId: string) {
    setPending((prev) => prev.filter((p) => p.localId !== localId))
  }

  // First pending item that is in "cropping" state (show one modal at a time)
  const activeCrop = pending.find((p) => p.status === "cropping")

  return (
    <>
      {/* Crop modal — one at a time */}
      {activeCrop && (
        <CropModal
          imageSrc={activeCrop.previewUrl}
          aspectRatio={config.aspectRatio}
          cropShape={config.cropShape}
          outputWidth={config.outputWidth}
          outputHeight={config.outputHeight}
          onConfirm={(file) => handleCropConfirm(activeCrop.localId, file)}
          onCancel={() => handleCropCancel(activeCrop.localId)}
        />
      )}

      <div className="space-y-3">
        {/* Drop zone + info */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div
            role="button"
            tabIndex={canAdd ? 0 : -1}
            aria-label="Upload image"
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-5 text-center transition-colors cursor-pointer select-none",
              "sm:w-44 sm:shrink-0 w-full",
              isDragging
                ? "border-whatsapp bg-whatsapp/5"
                : "border-border hover:border-whatsapp/50 hover:bg-muted/40",
              (!canAdd || disabled) && "pointer-events-none opacity-50"
            )}
            onClick={openFile}
            onKeyDown={(e) => e.key === "Enter" && openFile()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CloudUpload
              className={cn("h-7 w-7", isDragging ? "text-whatsapp" : "text-muted-foreground")}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Upload Images</p>
              <p className="text-xs text-muted-foreground">or drag and drop</p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-1.5 text-xs text-muted-foreground">
            <InfoLine>Add up to {maxImages} image{maxImages !== 1 ? "s" : ""}</InfoLine>
            <InfoLine>Max {CLOUDINARY_UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB per image</InfoLine>
            <InfoLine>JPG, PNG, WebP, GIF supported</InfoLine>
            <InfoLine>Crop size: {config.hint}</InfoLine>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{value.length} / {maxImages} images</p>

        {/* Thumbnails */}
        {(value.length > 0 || pending.filter((p) => p.status !== "cropping").length > 0) && (
          <div className="flex flex-wrap gap-2">
            {value.map((url) => (
              <div
                key={url}
                className={cn(
                  "group relative shrink-0 overflow-hidden rounded-md border bg-muted",
                  preset === "banner" ? "h-16 w-48" : "h-20 w-20"
                )}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeConfirmed(url)}
                  disabled={disabled}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:hidden"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {pending
              .filter((p) => p.status !== "cropping")
              .map((item) => (
                <div
                  key={item.localId}
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-md border bg-muted",
                    preset === "banner" ? "h-16 w-48" : "h-20 w-20"
                  )}
                >
                  {item.status === "uploading" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Loader2 className="h-5 w-5 animate-spin text-whatsapp" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/80 px-1 py-1">
                      <AlertCircle className="h-4 w-4 shrink-0 text-white" />
                      <p className="line-clamp-2 text-center text-[10px] leading-tight text-white">
                        {item.error}
                      </p>
                      <button
                        type="button"
                        onClick={() => dismissError(item.localId)}
                        className="text-[10px] text-white underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={CLOUDINARY_UPLOAD_LIMITS.ALLOWED_MIME_TYPES}
          multiple={maxImages > 1}
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </div>
    </>
  )
}

function InfoLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="h-3.5 w-3.5 shrink-0 text-whatsapp" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{children}</span>
    </div>
  )
}
