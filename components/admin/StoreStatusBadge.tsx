import { StoreStatus, getStatusLabel, getStatusColor } from "@/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StoreStatusBadgeProps {
  status: StoreStatus
  isBlocked?: boolean
  className?: string
}

export function StoreStatusBadge({ status, isBlocked, className }: StoreStatusBadgeProps) {
  // If blocked, override status display
  const displayStatus = isBlocked ? "blocked" : status

  return (
    <Badge 
      variant="outline" 
      className={cn(getStatusColor(displayStatus as StoreStatus), className)}
    >
      {getStatusLabel(displayStatus as StoreStatus)}
    </Badge>
  )
}
