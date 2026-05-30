"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { cloudinaryResize } from "@/lib/cloudinary"
import type { Store, StoreBanner } from "@/types"

interface BannerCarouselProps {
  store: Store
  storeSlug: string
}

const BG_PALETTE = [
  "linear-gradient(135deg,#f9dde2 0%,#fce8eb 45%,#faf0f2 100%)",
  "linear-gradient(135deg,#c8dfca 0%,#e0f0df 45%,#edf8ed 100%)",
  "linear-gradient(135deg,#ddd0f0 0%,#ede4f8 45%,#f5f0fc 100%)",
]
const DECO_PALETTE = ["✿", "✦", "◎"]

const FALLBACK: StoreBanner = {
  id: "fallback",
  image_url: "",
  title: "",
  subtitle: "",
  link: "",
}

export function BannerCarousel({ store, storeSlug }: BannerCarouselProps) {
  const banners = store.banners?.length ? store.banners : [FALLBACK]
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 4000)
    return () => clearInterval(timer)
  }, [banners.length])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      setCurrent((c) =>
        diff > 0 ? (c + 1) % banners.length : (c - 1 + banners.length) % banners.length
      )
    }
    touchStartX.current = null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-1">
      <div
        className="relative overflow-hidden select-none w-full h-40 sm:h-52 md:h-60"
        style={{ borderRadius: 20 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {banners.map((banner, i) => {
          const hasBannerImage = !!banner.image_url
          const useDarkText = !hasBannerImage
          const bg = BG_PALETTE[i % BG_PALETTE.length]
          const deco = DECO_PALETTE[i % DECO_PALETTE.length]
          const heading = banner.title || (i === 0 ? store.name : "")
          const sub = banner.subtitle || (i === 0 ? store.tagline || "Shop our collection" : "")
          const link = banner.link || `/s/${storeSlug}/products`

          return (
            <div
              key={banner.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === current ? 1 : 0, background: bg }}
            >
              {hasBannerImage && (
                <>
                  <Image
                    src={cloudinaryResize(banner.image_url, 1400)}
                    alt=""
                    fill
                    className="object-cover"
                    priority={i === 0}
                  />
                  <div className="absolute inset-0 bg-black/30" />
                </>
              )}

              {/* Decorative symbol */}
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 leading-none pointer-events-none font-bold"
                style={{
                  fontSize: "clamp(60px, 14vw, 160px)",
                  color: hasBannerImage ? "rgba(255,255,255,0.08)" : "rgba(201,144,154,0.12)",
                  lineHeight: 1,
                  zIndex: 1,
                }}
              >
                {deco}
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-8 py-4 max-w-[65%]">
                {i === 0 && store.logo_url && (
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden border-2 mb-2 shrink-0"
                    style={{
                      borderColor: useDarkText ? "var(--store-border)" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    <Image
                      src={cloudinaryResize(store.logo_url, 80)}
                      alt={store.name}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                )}
                {heading && (
                  <h1
                    className="font-bold leading-tight mb-1"
                    style={{
                      fontSize: "clamp(14px,3vw,24px)",
                      color: useDarkText ? "var(--store-text)" : "#fff",
                    }}
                  >
                    {heading}
                  </h1>
                )}
                {sub && (
                  <p
                    className="text-xs sm:text-sm mb-3 leading-snug"
                    style={{
                      color: useDarkText ? "var(--store-text-muted)" : "rgba(255,255,255,0.85)",
                    }}
                  >
                    {sub}
                  </p>
                )}
                {link && (
                  <Link
                    href={link}
                    className="inline-block px-4 py-1.5 text-sm font-semibold text-white w-fit transition-all hover:brightness-90"
                    style={{
                      backgroundColor: "var(--store-primary)",
                      borderRadius: "var(--store-btn-radius)",
                    }}
                  >
                    Shop Now
                  </Link>
                )}
              </div>
            </div>
          )
        })}

        {/* Dots — only shown when more than 1 banner */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  height: 6,
                  width: i === current ? 20 : 6,
                  borderRadius: 999,
                  transition: "width 0.3s, background-color 0.3s",
                  backgroundColor:
                    i === current ? "var(--store-primary)" : "var(--store-border)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
