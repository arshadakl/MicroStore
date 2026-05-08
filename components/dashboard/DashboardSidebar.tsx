"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Store, getStatusLabel, getStatusColor } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Package,
  Tag,
  BarChart2,
  Settings,
  LogOut,
  ExternalLink,
  Store as StoreIcon,
  Menu,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

interface DashboardSidebarProps {
  store: Store | null
  userEmail: string
  productCount?: number
}

function SidebarInner({
  store,
  userEmail,
  navItems,
  onNavigate,
}: {
  store: Store | null
  userEmail: string
  navItems: NavItem[]
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-7 h-7 rounded-md bg-whatsapp flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-foreground text-sm">MicroStore</span>
        </Link>
      </div>

      {/* Store info */}
      {store && (
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{store.name}</p>
                <Badge
                  className={cn("text-[10px] px-1.5 py-0 shrink-0", getStatusColor(store.status))}
                  variant="outline"
                >
                  {getStatusLabel(store.status)}
                </Badge>
              </div>
              <a
                href={`/s/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-whatsapp hover:underline"
                onClick={onNavigate}
              >
                View store
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-whatsapp/10 text-whatsapp"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-3 shrink-0">
        <p className="text-xs text-muted-foreground px-3 truncate">{userEmail}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground px-3"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

export function DashboardSidebar({ store, userEmail, productCount }: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    {
      href: "/dashboard/products",
      label: "Products",
      icon: Package,
      badge: productCount,
    },
    { href: "/dashboard/categories", label: "Categories", icon: Tag },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border bg-sidebar flex-col shrink-0">
        <SidebarInner store={store} userEmail={userEmail} navItems={navItems} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar border-b border-border flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-whatsapp flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-foreground text-sm">MicroStore</span>
        </Link>
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <SidebarInner
            store={store}
            userEmail={userEmail}
            navItems={navItems}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
