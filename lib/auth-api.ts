import { cookies } from "next/headers";
import { getUserFromToken } from "./auth";
import { headers } from "next/headers";

/**
 * Get authenticated user from request (supports both cookie and Bearer token)
 * For web: Uses cookie-based auth
 * For mobile: Uses Bearer token in Authorization header
 */
export async function getAuthenticatedUser() {
  // Try Bearer token first (for mobile apps)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (user) {
      return user;
    }
  }

  // Fall back to cookie-based auth (for web)
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  
  if (token) {
    const user = await getUserFromToken(token);
    if (user) {
      return user;
    }
  }

  return null;
}

















