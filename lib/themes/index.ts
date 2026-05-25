export interface StoreThemeColors {
  bg: string
  cardBg: string
  text: string
  textMuted: string
  primary: string
  border: string
  btnRadius: string
  accent?: string
  cardShadow?: string
  primaryHover?: string
  primaryLight?: string
  navbarBg?: string
}

export interface StoreThemeConfig {
  id: string
  name: string
  description: string
  primaryColor: string
  colors: StoreThemeColors
}

// When adding theme N: add one entry here + add id to THEME_IDS in lib/constants.ts
const THEME_REGISTRY: Record<string, StoreThemeConfig> = {
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Soft, warm tones with a feminine touch",
    primaryColor: "#C9909A",
    colors: {
      bg: "#FAF7F5",
      cardBg: "#FFFFFF",
      text: "#2C2422",
      textMuted: "#9B8E8B",
      primary: "#C9909A",
      border: "#EDD5D0",
      btnRadius: "20px",
      accent: "#A8B5A2",
      cardShadow: "0 2px 12px rgba(201,144,154,0.10)",
      primaryHover: "#b8737e",
      primaryLight: "#f5e8eb",
      navbarBg: "rgba(250,247,245,0.90)",
    },
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Bold with teal accents",
    primaryColor: "#14b8a6",
    colors: {
      bg: "#f0fdfa",
      cardBg: "#ffffff",
      text: "#134e4a",
      textMuted: "#5eead4",
      primary: "#14b8a6",
      border: "#99f6e4",
      btnRadius: "9999px",
    },
  },
  luxury: {
    id: "luxury",
    name: "Luxury",
    description: "Dark and elegant with gold",
    primaryColor: "#d4af37",
    colors: {
      bg: "#1a1a1a",
      cardBg: "#2d2d2d",
      text: "#f5f5f5",
      textMuted: "#a3a3a3",
      primary: "#d4af37",
      border: "#404040",
      btnRadius: "0",
    },
  },
}

export function getThemeConfig(id: string): StoreThemeConfig {
  return THEME_REGISTRY[id] ?? THEME_REGISTRY.minimal
}

export function getAllThemes(): StoreThemeConfig[] {
  return Object.values(THEME_REGISTRY)
}

export function buildThemeCssVars(colors: StoreThemeColors): string {
  const vars: string[] = [
    `--store-bg:${colors.bg}`,
    `--store-card-bg:${colors.cardBg}`,
    `--store-text:${colors.text}`,
    `--store-text-muted:${colors.textMuted}`,
    `--store-primary:${colors.primary}`,
    `--store-border:${colors.border}`,
    `--store-btn-radius:${colors.btnRadius}`,
  ]
  if (colors.accent) vars.push(`--store-accent:${colors.accent}`)
  if (colors.cardShadow) vars.push(`--store-card-shadow:${colors.cardShadow}`)
  if (colors.primaryHover) vars.push(`--store-primary-hover:${colors.primaryHover}`)
  if (colors.primaryLight) vars.push(`--store-primary-light:${colors.primaryLight}`)
  if (colors.navbarBg) vars.push(`--store-navbar-bg:${colors.navbarBg}`)
  return vars.join(";")
}
