export function getAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdmin(userId: string): boolean {
  return getAdminIds().includes(userId);
}

// Browser-safe admin check. Reads NEXT_PUBLIC_ADMIN_USER_IDS, which is a
// non-sensitive mirror used purely for conditionally rendering admin UI;
// server-side enforcement still goes through `isAdmin` above.
export function getPublicAdminIds(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminClient(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getPublicAdminIds().includes(userId);
}
