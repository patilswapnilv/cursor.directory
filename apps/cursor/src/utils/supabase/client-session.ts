/**
 * Cheap, synchronous "is someone logged in?" check based on the presence of
 * Supabase auth cookies. Useful for client components that only need to gate
 * UI (e.g. show a login prompt) without waiting for a session round-trip.
 */
export const isAuthenticated = (): boolean => {
  if (typeof document === "undefined") return false;

  const cookies = document.cookie.split(";");
  return cookies.some((cookie) => cookie.trim().startsWith("sb-"));
};
