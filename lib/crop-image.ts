import type { Area } from "react-easy-crop"

/**
 * Draw the cropped region of an image onto a canvas and return it as a File.
 * outputWidth/outputHeight define the exact pixel dimensions of the saved image.
 */
export function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number,
  fileName = "cropped.jpg"
): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = outputWidth
      canvas.height = outputHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("Canvas context unavailable")); return }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas is empty")); return }
          resolve(new File([blob], fileName, { type: "image/jpeg" }))
        },
        "image/jpeg",
        0.92
      )
    }
    image.onerror = () => reject(new Error("Failed to load image for cropping"))
    image.src = imageSrc
  })
}
