"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"
import { getCroppedImg } from "@/lib/crop-image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { ZoomIn } from "lucide-react"

interface CropModalProps {
  /** Object URL of the image to crop */
  imageSrc: string
  aspectRatio: number
  cropShape?: "rect" | "round"
  outputWidth: number
  outputHeight: number
  /** Called with the cropped File. If signPromise is provided it resolves in parallel. */
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export function CropModal({
  imageSrc,
  aspectRatio,
  cropShape = "rect",
  outputWidth,
  outputHeight,
  onConfirm,
  onCancel,
}: CropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [cropError, setCropError] = useState<string | null>(null)

  const onCropComplete = useCallback((_: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    setCropError(null)
    try {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels, outputWidth, outputHeight)
      onConfirm(file)
    } catch (err) {
      setCropError(err instanceof Error ? err.message : "Failed to process image. Try a different file.")
      setProcessing(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="p-0 gap-0 max-w-lg w-full sm:rounded-xl overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base">Crop Image</DialogTitle>
        </DialogHeader>

        {/* Cropper area — fixed height, relative container required by react-easy-crop */}
        <div className="relative w-full bg-black" style={{ height: "min(60vw, 340px)" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 pt-4 pb-2 space-y-1.5">
          <div className="flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {zoom.toFixed(1)}×
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Pinch or scroll to zoom · Drag to reposition
          </p>
        </div>

        {cropError && (
          <p className="px-4 pb-2 text-xs text-destructive text-center">{cropError}</p>
        )}

        <DialogFooter className="px-4 pb-4 pt-2 flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={processing} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button
            className="bg-whatsapp hover:bg-whatsapp-dark text-white flex-1 sm:flex-none"
            onClick={handleConfirm}
            disabled={processing}
          >
            {processing ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              "Crop & Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
