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
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"
import {
  blockStore,
  unblockStore,
  pauseStore,
  activateStore,
  extendTrial,
  convertToRegular,
  setSubscription,
  softDeleteStore,
  restoreStore,
  purgeStore,
} from "@/lib/actions/admin"
import { SUBSCRIPTION_CONFIG } from "@/lib/constants"
import {
  MoreHorizontal,
  Play,
  Pause,
  Ban,
  ShieldCheck,
  Clock,
  Trash2,
  RotateCcw,
  Flame,
  ExternalLink,
  Crown,
  CalendarCheck,
} from "lucide-react"

interface AdminStoreActionsProps {
  store: Store
}

type DialogType =
  | "extend-trial"
  | "convert-regular"
  | "set-subscription"
  | "move-trash"
  | "purge"
  | null

export function AdminStoreActions({ store }: AdminStoreActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState<DialogType>(null)
  const [trialDays, setTrialDays] = useState("7")

  function defaultEndDate(daysFromNow = SUBSCRIPTION_CONFIG.DEFAULT_DAYS) {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const [regularEndsAt, setRegularEndsAt] = useState(defaultEndDate)
  const [subEndsAt, setSubEndsAt] = useState(defaultEndDate)

  const isDeleted = store.is_deleted
  const isBlocked = store.is_blocked || store.status === "blocked"
  const isPaused = store.status === "paused"
  const isActive = store.status === "active"
  const isTrial = store.status === "trial"

  async function run<T>(
    key: string,
    fn: () => Promise<{ success: boolean; error?: string; data?: T }>,
    successMsg: string,
    afterSuccess?: () => void
  ) {
    setLoading(key)
    const result = await fn()
    setLoading(null)

    if (result.success) {
      toast({ title: "Success", description: successMsg })
      afterSuccess?.()
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error || "Action failed", variant: "destructive" })
    }
  }

  async function handleExtendTrial() {
    const days = parseInt(trialDays)
    if (isNaN(days) || days <= 0) {
      toast({ title: "Error", description: "Enter valid days", variant: "destructive" })
      return
    }
    await run("extend", () => extendTrial(store.id, days), `Trial extended by ${days} days`, () =>
      setOpenDialog(null)
    )
  }

  async function handleConvertToRegular() {
    if (!regularEndsAt) {
      toast({ title: "Error", description: "Select an end date", variant: "destructive" })
      return
    }
    await run(
      "convert",
      () => convertToRegular(store.id, regularEndsAt),
      `Store converted to regular — ends ${new Date(regularEndsAt).toLocaleDateString()}`,
      () => setOpenDialog(null)
    )
  }

  async function handleSetSubscription() {
    if (!subEndsAt) {
      toast({ title: "Error", description: "Select an end date", variant: "destructive" })
      return
    }
    await run(
      "subscription",
      () => setSubscription(store.id, subEndsAt),
      `Subscription ends ${new Date(subEndsAt).toLocaleDateString()}`,
      () => setOpenDialog(null)
    )
  }

  async function handleMoveToTrash() {
    await run("trash", () => softDeleteStore(store.id), "Store moved to trash", () => {
      setOpenDialog(null)
      router.push("/admin/stores")
    })
  }

  async function handlePurge() {
    await run("purge", () => purgeStore(store.id), "Store permanently deleted", () => {
      setOpenDialog(null)
      router.push("/admin/stores?tab=trash")
    })
  }

  if (isDeleted) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading === "restore"}
            onClick={() => run("restore", () => restoreStore(store.id), "Store restored from trash")}
          >
            {loading === "restore" ? <Spinner className="h-4 w-4" /> : <RotateCcw className="h-4 w-4 mr-1" />}
            Restore
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setOpenDialog("purge")}
          >
            <Flame className="h-4 w-4 mr-1" />
            Delete Forever
          </Button>
        </div>

        <Dialog open={openDialog === "purge"} onOpenChange={(o) => !o && setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Permanently Delete Store</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>{store.name}</strong> and all its data. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handlePurge} disabled={loading === "purge"}>
                {loading === "purge" ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Delete Forever
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Storefront
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Status</DropdownMenuLabel>

          {(isBlocked || isPaused) && (
            <DropdownMenuItem
              onClick={() => run("activate", () => activateStore(store.id), "Store activated")}
              disabled={loading === "activate"}
            >
              <Play className="mr-2 h-4 w-4 text-green-600" />
              Activate Store
            </DropdownMenuItem>
          )}

          {isBlocked && (
            <DropdownMenuItem
              onClick={() => run("unblock", () => unblockStore(store.id), "Store unblocked")}
              disabled={loading === "unblock"}
            >
              <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
              Unblock Store
            </DropdownMenuItem>
          )}

          {!isBlocked && (isActive || isTrial) && (
            <DropdownMenuItem
              onClick={() => run("pause", () => pauseStore(store.id), "Store paused")}
              disabled={loading === "pause"}
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause Store
            </DropdownMenuItem>
          )}

          {!isBlocked && (
            <DropdownMenuItem
              onClick={() => run("block", () => blockStore(store.id), "Store blocked")}
              disabled={loading === "block"}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Block Store
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Subscription</DropdownMenuLabel>

          {(isTrial || isBlocked || isPaused) && (
            <DropdownMenuItem onClick={() => setOpenDialog("extend-trial")}>
              <Clock className="mr-2 h-4 w-4" />
              Extend Trial
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setOpenDialog("convert-regular")}>
            <Crown className="mr-2 h-4 w-4 text-amber-500" />
            Convert to Regular
          </DropdownMenuItem>

          {isActive && (
            <DropdownMenuItem onClick={() => setOpenDialog("set-subscription")}>
              <CalendarCheck className="mr-2 h-4 w-4" />
              Set Subscription
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setOpenDialog("move-trash")}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Move to Trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Extend Trial Dialog */}
      <Dialog open={openDialog === "extend-trial"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
            <DialogDescription>
              Add days to the trial period for <strong>{store.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="trial-days">Days to add</Label>
            <Input
              id="trial-days"
              type="number"
              min="1"
              max="365"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
            <Button onClick={handleExtendTrial} disabled={loading === "extend"}>
              {loading === "extend" && <Spinner className="mr-2 h-4 w-4" />}
              Extend Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Regular Dialog */}
      <Dialog open={openDialog === "convert-regular"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Regular Store</DialogTitle>
            <DialogDescription>
              Move <strong>{store.name}</strong> from trial to a paid regular store.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="regular-ends-at">Subscription end date</Label>
            <Input
              id="regular-ends-at"
              type="date"
              min={todayStr}
              value={regularEndsAt}
              onChange={(e) => setRegularEndsAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
            <Button onClick={handleConvertToRegular} disabled={loading === "convert"}>
              {loading === "convert" && <Spinner className="mr-2 h-4 w-4" />}
              Convert Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Subscription Dialog */}
      <Dialog open={openDialog === "set-subscription"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Subscription</DialogTitle>
            <DialogDescription>
              Pick the date when <strong>{store.name}</strong>&apos;s subscription ends.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="sub-ends-at">Subscription end date</Label>
            <Input
              id="sub-ends-at"
              type="date"
              min={todayStr}
              value={subEndsAt}
              onChange={(e) => setSubEndsAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
            <Button onClick={handleSetSubscription} disabled={loading === "subscription"}>
              {loading === "subscription" && <Spinner className="mr-2 h-4 w-4" />}
              Set Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Trash Dialog */}
      <Dialog open={openDialog === "move-trash"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Store to Trash</DialogTitle>
            <DialogDescription>
              <strong>{store.name}</strong> will be moved to trash. All Cloudinary images will be deleted immediately.
              The store record is kept for {SUBSCRIPTION_CONFIG.SOFT_DELETE_RETENTION_DAYS} days then permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleMoveToTrash} disabled={loading === "trash"}>
              {loading === "trash" && <Spinner className="mr-2 h-4 w-4" />}
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
