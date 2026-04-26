"use client"

import { Store, getTrialDaysRemaining } from "@/types"
import { Clock, AlertTriangle } from "lucide-react"

interface TrialBannerProps {
  store: Store
}

export function TrialBanner({ store }: TrialBannerProps) {
  if (store.status !== "trial") return null

  const daysRemaining = getTrialDaysRemaining(store.trial_ends_at)
  const isUrgent = daysRemaining <= 3
  const isExpired = daysRemaining <= 0

  if (isExpired) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Your trial has expired
            </p>
            <p className="text-xs text-destructive/80 mt-0.5">
              Contact support to continue using MicroStore.
            </p>
          </div>
          <a
            href="mailto:support@microstore.com?subject=Trial%20Extension%20Request"
            className="text-sm font-medium text-destructive hover:underline shrink-0"
          >
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border-b px-4 py-3 ${
        isUrgent
          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
          : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
      }`}
    >
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <Clock
          className={`w-5 h-5 shrink-0 ${
            isUrgent ? "text-amber-600" : "text-blue-600"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              isUrgent ? "text-amber-800 dark:text-amber-200" : "text-blue-800 dark:text-blue-200"
            }`}
          >
            {daysRemaining === 1
              ? "1 day remaining in your trial"
              : `${daysRemaining} days remaining in your trial`}
          </p>
          <p
            className={`text-xs mt-0.5 ${
              isUrgent ? "text-amber-700/80 dark:text-amber-300/80" : "text-blue-700/80 dark:text-blue-300/80"
            }`}
          >
            {isUrgent
              ? "Upgrade now to keep your store active."
              : "Enjoying MicroStore? Contact us to upgrade."}
          </p>
        </div>
        <a
          href="mailto:support@microstore.com?subject=Upgrade%20Request"
          className={`text-sm font-medium shrink-0 hover:underline ${
            isUrgent ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"
          }`}
        >
          Upgrade
        </a>
      </div>
    </div>
  )
}
