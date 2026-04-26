"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  LogOut,
  Shield,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/admin/products", label: "Products", icon: Package },
]

interface AdminSidebarProps {
  userEmail: string
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
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
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-destructive flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground text-sm">Admin Panel</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-destructive/10 text-destructive"
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
        <div className="px-3">
          <p className="text-xs text-destructive font-medium">Super Admin</p>
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>
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
