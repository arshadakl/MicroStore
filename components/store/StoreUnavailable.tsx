import Link from "next/link"
import { Store as StoreIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StoreUnavailable() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <StoreIcon className="w-8 h-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Store Unavailable</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This store is currently not available. It may be temporarily paused or no longer active.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/">
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  )
}
