import type { ComponentType } from "react"
import type { Store, Product, Category } from "@/types"

// ── Shared prop interfaces (contract for all theme components) ──────────────
// Theme components MUST accept these exact interfaces.

export interface ProductCardProps {
  product: Product
  storeSlug: string
  categoryName?: string
}

export interface BannerCarouselProps {
  store: Store
  storeSlug: string
}

export interface ProductsGridProps {
  products: Product[]
  categories: Category[]
  storeSlug: string
}

export interface ProductSectionProps {
  category: Category
  products: Product[]
  storeSlug: string
  allProductsHref: string
}

export interface ThemeComponentSet {
  ProductCard: ComponentType<ProductCardProps>
  BannerCarousel: ComponentType<BannerCarouselProps>
  ProductsGrid: ComponentType<ProductsGridProps>
  ProductSection: ComponentType<ProductSectionProps>
}

// ── Theme component imports ─────────────────────────────────────────────────
// When adding theme N: add 4 imports here + one entry in THEME_COMPONENTS below.

import { ProductCard as MinimalProductCard } from "./themes/minimal/ProductCard"
import { BannerCarousel as MinimalBannerCarousel } from "./themes/minimal/BannerCarousel"
import { ProductsGrid as MinimalProductsGrid } from "./themes/minimal/ProductsGrid"
import { ProductSection as MinimalProductSection } from "./themes/minimal/ProductSection"

import { ProductCard as ModernProductCard } from "./themes/modern/ProductCard"
import { BannerCarousel as ModernBannerCarousel } from "./themes/modern/BannerCarousel"
import { ProductsGrid as ModernProductsGrid } from "./themes/modern/ProductsGrid"
import { ProductSection as ModernProductSection } from "./themes/modern/ProductSection"

import { ProductCard as LuxuryProductCard } from "./themes/luxury/ProductCard"
import { BannerCarousel as LuxuryBannerCarousel } from "./themes/luxury/BannerCarousel"
import { ProductsGrid as LuxuryProductsGrid } from "./themes/luxury/ProductsGrid"
import { ProductSection as LuxuryProductSection } from "./themes/luxury/ProductSection"

// ── Registry ────────────────────────────────────────────────────────────────

const THEME_COMPONENTS: Record<string, ThemeComponentSet> = {
  minimal: {
    ProductCard: MinimalProductCard,
    BannerCarousel: MinimalBannerCarousel,
    ProductsGrid: MinimalProductsGrid,
    ProductSection: MinimalProductSection,
  },
  modern: {
    ProductCard: ModernProductCard,
    BannerCarousel: ModernBannerCarousel,
    ProductsGrid: ModernProductsGrid,
    ProductSection: ModernProductSection,
  },
  luxury: {
    ProductCard: LuxuryProductCard,
    BannerCarousel: LuxuryBannerCarousel,
    ProductsGrid: LuxuryProductsGrid,
    ProductSection: LuxuryProductSection,
  },
}

export function getThemeComponents(themeId: string): ThemeComponentSet {
  return THEME_COMPONENTS[themeId] ?? THEME_COMPONENTS.minimal
}
