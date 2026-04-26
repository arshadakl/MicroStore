"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Store } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"
import {
  blockStore,
  pauseStore,
  activateStore,
  extendTrial,
  deleteStore,
} from "@/lib/actions/admin"
import {
  MoreHorizontal,
  Play,
  Pause,
  Ban,
  Clock,
  Trash2,
  ExternalLink,
} from "lucide-react"

interface AdminStoreActionsProps {
  store: Store
}

export function AdminStoreActions({ store }: AdminStoreActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [extendDays, setExtendDays] = useState("7")
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  async function handleAction(
    action: "block" | "pause" | "activate" | "delete",
    actionFn: (storeId: string) => Promise<{ success: boolean; error?: string }>
  ) {
    setLoading(action)
    const result = await actionFn(store.id)
    setLoading(null)

    if (result.success) {
      toast({
        title: "Success",
        description: `Store ${action}ed successfully`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || `Failed to ${action} store`,
        variant: "destructive",
      })
    }
  }

  async function handleExtendTrial() {
    const days = parseInt(extendDays)
    if (isNaN(days) || days <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of days",
        variant: "destructive",
      })
      return
    }

    setLoading("extend")
    const result = await extendTrial(store.id, days)
    setLoading(null)
    setShowExtendDialog(false)

    if (result.success) {
      toast({
        title: "Success",
        description: `Trial extended by ${days} days`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to extend trial",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    setLoading("delete")
    const result = await deleteStore(store.id)
    setLoading(null)
    setShowDeleteDialog(false)

    if (result.success) {
      toast({
        title: "Success",
        description: "Store deleted successfully",
      })
      router.refresh()
      router.push("/admin/stores")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete store",
        variant: "destructive",
      })
    }
  }

  const isBlocked = store.is_blocked || store.status === "blocked"
  const isPaused = store.status === "paused"
  const isActive = store.status === "active" || store.status === "trial"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a
              href={`/s/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Storefront
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {(isBlocked || isPaused) && (
            <DropdownMenuItem
              onClick={() => handleAction("activate", activateStore)}
              disabled={loading === "activate"}
            >
              <Play className="mr-2 h-4 w-4" />
              {loading === "activate" ? "Activating..." : "Activate Store"}
            </DropdownMenuItem>
          )}

          {isActive && (
            <DropdownMenuItem
              onClick={() => handleAction("pause", pauseStore)}
              disabled={loading === "pause"}
            >
              <Pause className="mr-2 h-4 w-4" />
              {loading === "pause" ? "Pausing..." : "Pause Store"}
            </DropdownMenuItem>
          )}

          {!isBlocked && (
            <DropdownMenuItem
              onClick={() => handleAction("block", blockStore)}
              disabled={loading === "block"}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              {loading === "block" ? "Blocking..." : "Block Store"}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowExtendDialog(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Extend Trial
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Store
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Extend Trial Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
            <DialogDescription>
              Extend the trial period for <strong>{store.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="days">Number of days to extend</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendTrial} disabled={loading === "extend"}>
              {loading === "extend" ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Extending...
                </>
              ) : (
                "Extend Trial"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Store</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{store.name}</strong>? This action cannot be undone. All products and analytics will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading === "delete"}
            >
              {loading === "delete" ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete Store"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
