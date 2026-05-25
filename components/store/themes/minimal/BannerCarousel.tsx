"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { cloudinaryResize } from "@/lib/cloudinary"
import type { Store } from "@/types"

interface BannerCarouselProps {
  store: Store
  storeSlug: string
}

interface Slide {
  bg: string
  deco: string
  heading: string
  sub: string
  link: string
}

const SLIDE_TEMPLATES = [
  { bg: "linear-gradient(135deg,#f9dde2 0%,#fce8eb 45%,#faf0f2 100%)", deco: "✿", heading: "", sub: "" },
  { bg: "linear-gradient(135deg,#c8dfca 0%,#e0f0df 45%,#edf8ed 100%)", deco: "✦", heading: "New Arrivals ✦", sub: "Fresh picks, just dropped" },
  { bg: "linear-gradient(135deg,#ddd0f0 0%,#ede4f8 45%,#f5f0fc 100%)", deco: "◎", heading: "Made with Love ♡", sub: "Pieces that tell your story" },
]

export function BannerCarousel({ store, storeSlug }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const slides: Slide[] = SLIDE_TEMPLATES.map((s, i) =>
    i === 0
      ? {
          ...s,
          heading: store.banner_title || store.name,
          sub: store.banner_subtitle || store.tagline || "Shop our collection",
          link: store.banner_link || `/s/${storeSlug}/products`,
        }
      : { ...s, link: `/s/${storeSlug}/products` }
  )

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000)
    return () => clearInterval(timer)
  }, [slides.length])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      setCurrent((c) =>
        diff > 0 ? (c + 1) % slides.length : (c - 1 + slides.length) % slides.length
      )
    }
    touchStartX.current = null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-1">
    <div
      className="relative overflow-hidden select-none w-full h-56 sm:h-72 md:h-80"
      style={{ borderRadius: 20 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, i) => {
        const isFirst = i === 0
        const hasBannerImage = isFirst && !!store.banner_url
        const useDarkText = !hasBannerImage

        return (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0, background: slide.bg }}
          >
            {/* Real banner image on slide 0 */}
            {isFirst && store.banner_url && (
              <>
                <Image
                  src={cloudinaryResize(store.banner_url, 1200)}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-black/30" />
              </>
            )}

            {/* Large decorative symbol — right side */}
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 leading-none pointer-events-none font-bold"
              style={{
                fontSize: "clamp(80px, 18vw, 200px)",
                color: hasBannerImage ? "rgba(255,255,255,0.08)" : "rgba(201,144,154,0.12)",
                lineHeight: 1,
                zIndex: 1,
              }}
            >
              {slide.deco}
            </div>

            {/* Left-aligned vertically-centered content */}
            <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-8 py-6 max-w-[60%]">
              {isFirst && store.logo_url && (
                <div
                  className="w-10 h-10 rounded-full overflow-hidden border-2 mb-3 shrink-0"
                  style={{ borderColor: useDarkText ? "var(--store-border)" : "rgba(255,255,255,0.5)" }}
                >
                  <Image
                    src={cloudinaryResize(store.logo_url, 80)}
                    alt={store.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              )}
              <h1
                className="font-bold leading-tight mb-1"
                style={{
                  fontSize: "clamp(16px,3.5vw,28px)",
                  color: useDarkText ? "var(--store-text)" : "#fff",
                }}
              >
                {slide.heading}
              </h1>
              <p
                className="text-sm mb-4 leading-snug"
                style={{ color: useDarkText ? "var(--store-text-muted)" : "rgba(255,255,255,0.85)" }}
              >
                {slide.sub}
              </p>
              {slide.link && (
                <Link
                  href={slide.link}
                  className="inline-block px-5 py-2 text-sm font-semibold text-white w-fit transition-all hover:brightness-90"
                  style={{
                    backgroundColor: "var(--store-primary)",
                    borderRadius: "var(--store-btn-radius)",
                  }}
                >
                  {i === 0 ? "Shop Now" : "Explore →"}
                </Link>
              )}
            </div>
          </div>
        )
      })}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              height: 6,
              width: i === current ? 20 : 6,
              borderRadius: 999,
              transition: "width 0.3s, background-color 0.3s",
              backgroundColor: i === current ? "var(--store-primary)" : "var(--store-border)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
    </div>
  )
}
