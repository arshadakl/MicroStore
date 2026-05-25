"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { cloudinaryResize } from "@/lib/cloudinary"
import type { Store } from "@/types"

const FALLBACK_GRADIENTS = [
  "from-stone-950 via-neutral-900 to-zinc-950",
  "from-zinc-950 via-stone-900 to-neutral-950",
  "from-neutral-950 via-zinc-900 to-stone-950",
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
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="relative overflow-hidden w-full" style={{ minHeight: "70vh" }}>
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
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ))}

      {/* Centered ceremonial overlay */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20"
        style={{ minHeight: "70vh" }}
      >
        <div className="w-12 h-px bg-[#d4af37] mb-6" />
        <h1 className="text-4xl sm:text-7xl font-thin tracking-widest text-white uppercase mb-3">
          {store.name}
        </h1>
        {store.tagline && (
          <p className="text-sm italic tracking-wide mb-8" style={{ color: "#d4af37" }}>
            {store.tagline}
          </p>
        )}
        <div className="w-12 h-px bg-[#d4af37] mb-8" />
        <Link
          href={`/s/${storeSlug}/products`}
          className="px-8 py-3 text-xs font-medium tracking-widest uppercase transition-colors border"
          style={{
            borderColor: "#d4af37",
            color: "#d4af37",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.backgroundColor = "#d4af37"
            el.style.color = "#0F0E0D"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.backgroundColor = "transparent"
            el.style.color = "#d4af37"
          }}
        >
          Discover the Collection
        </Link>
      </div>

      {/* Gold dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="w-1.5 h-1.5 rounded-full border transition-colors"
            style={{
              borderColor: "#d4af37",
              backgroundColor: i === current ? "#d4af37" : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  )
}
