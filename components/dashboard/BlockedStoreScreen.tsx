"use client"

import { Store } from "@/types"
import { ShieldX, Mail, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BlockedStoreScreenProps {
  store: Store
}

export function BlockedStoreScreen({ store }: BlockedStoreScreenProps) {
  const isPaused = store.status === "paused"
  const isBlocked = store.is_blocked || store.status === "blocked"

  if (!isPaused && !isBlocked) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              isBlocked ? "bg-destructive/10" : "bg-amber-100 dark:bg-amber-900/30"
            }`}
          >
            {isBlocked ? (
              <ShieldX className="w-8 h-8 text-destructive" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              {isBlocked ? "Store Blocked" : "Store Paused"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isBlocked
                ? "Your store has been blocked by an administrator. This may be due to a policy violation or payment issue."
                : "Your store has been paused. Your storefront is temporarily unavailable to customers."}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              {isBlocked
                ? "Please contact support to resolve this issue and restore your store."
                : "Contact support to reactivate your store."}
            </p>
            <Button
              asChild
              className={isBlocked ? "bg-destructive hover:bg-destructive/90" : "bg-whatsapp hover:bg-whatsapp-dark"}
            >
              <a href={`mailto:support@microstore.com?subject=Store%20Issue%20-%20${encodeURIComponent(store.name)}`}>
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Store: <span className="font-medium text-foreground">{store.name}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
