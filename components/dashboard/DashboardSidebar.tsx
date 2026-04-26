"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Store, getStatusLabel, getStatusColor } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  ExternalLink,
  Store as StoreIcon,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

interface DashboardSidebarProps {
  store: Store | null
  userEmail: string
}

export function DashboardSidebar({ store, userEmail }: DashboardSidebarProps) {
  const pathname = usePathname()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-whatsapp flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-foreground text-sm">MicroStore</span>
        </Link>
      </div>

      {/* Store info */}
      {store && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{store.name}</p>
                <Badge 
                  className={cn("text-[10px] px-1.5 py-0", getStatusColor(store.status))} 
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
              >
                View store
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-whatsapp/10 text-whatsapp"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-3">
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
    </aside>
  )
}
