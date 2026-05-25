"use client"

import { useState } from "react"
import Image from "next/image"
import { Package, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cloudinaryResize } from "@/lib/cloudinary"

interface ImageGalleryProps {
  images: string[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (images.length === 0) {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-16 h-16 text-muted-foreground/20" />
        </div>
      </div>
    )
  }

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    setSelected((s) => (s - 1 + images.length) % images.length)
  }

  function next(e: React.MouseEvent) {
    e.stopPropagation()
    setSelected((s) => (s + 1) % images.length)
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className="relative aspect-square rounded-xl overflow-hidden bg-muted cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <Image src={cloudinaryResize(images[selected], 800)} alt={title} fill className="object-cover" priority />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
            <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
              Click to zoom
            </span>
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                  i !== selected ? "border-border hover:border-muted-foreground" : ""
                }`}
                style={i === selected ? { borderColor: "var(--store-primary, #25D366)" } : {}}
              >
                <Image src={cloudinaryResize(img, 128)} alt={`${title} ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={prev}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={next}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div
            className="relative w-full max-w-3xl max-h-[85vh] mx-4 sm:mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selected]}
              alt={title}
              width={900}
              height={900}
              className="object-contain w-full h-full max-h-[85vh]"
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelected(i) }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === selected ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
