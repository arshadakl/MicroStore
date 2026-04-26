type RoleContainer = {
  app_metadata?: Record<string, unknown> | null
  user_metadata?: Record<string, unknown> | null
}

/**
 * Prefer app_metadata for authorization and keep user_metadata as a temporary fallback.
 */
export function isAdminUser(user: RoleContainer | null | undefined): boolean {
  if (!user) return false

  const appRole = user.app_metadata?.role
  if (typeof appRole === "string" && appRole === "admin") return true

  const userRole = user.user_metadata?.role
  return typeof userRole === "string" && userRole === "admin"
}
