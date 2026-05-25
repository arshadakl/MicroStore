"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { cloudinaryResize } from "@/lib/cloudinary"
import type { Store } from "@/types"

const FALLBACK_GRADIENTS = [
  "from-teal-900 via-emerald-900 to-cyan-950",
  "from-cyan-900 via-teal-800 to-emerald-900",
  "from-emerald-950 via-teal-900 to-cyan-900",
]

interface BannerCarouselProps {
  store: Store
  storeSlug: string
}

export function BannerCarousel({ store, storeSlug }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0)

  const slides: Array<{ image?: string; gradient?: string }> = store.banner_url
    ? [{ image: cloudinaryResize(store.banner_url, 1200) }, ...FALLBACK_GRADIENTS.map((g) => ({ gradient: g }))]
    : FALLBACK_GRADIENTS.map((g) => ({ gradient: g }))

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="relative overflow-hidden w-full" style={{ minHeight: "55vh", maxHeight: "70vh" }}>
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          {slide.image ? (
            <Image src={slide.image} alt="" fill className="object-cover" priority={i === 0} />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${slide.gradient}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Left-aligned editorial overlay */}
      <div className="relative z-10 h-full flex flex-col justify-end px-8 sm:px-16 pb-12 max-w-3xl" style={{ minHeight: "55vh" }}>
        <h1 className="text-4xl sm:text-6xl font-light text-white tracking-tight mb-2">
          {store.name}
        </h1>
        {store.tagline && (
          <p className="text-base text-white/70 italic mb-6">{store.tagline}</p>
        )}
        <Link
          href={`/s/${storeSlug}/products`}
          className="inline-flex items-center text-sm border-b pb-0.5 hover:opacity-80 transition-opacity w-fit"
          style={{ color: "var(--store-primary)", borderColor: "var(--store-primary)" }}
        >
          Explore the Collection →
        </Link>
      </div>

      {/* Dash indicators — editorial */}
      <div className="absolute bottom-6 left-8 sm:left-16 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-px transition-all bg-white ${i === current ? "w-8 opacity-100" : "w-4 opacity-40"}`}
            style={{ height: "1px" }}
          />
        ))}
      </div>
    </div>
  )
}
