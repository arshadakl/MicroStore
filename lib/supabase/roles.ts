type RoleContainer = {
  app_metadata?: Record<string, unknown> | null
}

export function isAdminUser(user: RoleContainer | null | undefined): boolean {
  if (!user) return false
  const appRole = user.app_metadata?.role
  return typeof appRole === "string" && appRole === "admin"
}
