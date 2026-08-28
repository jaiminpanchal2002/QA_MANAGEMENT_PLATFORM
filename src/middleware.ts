import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge middleware for coarse route protection.
 *
 * This is an optimization / UX guard only — it redirects unauthenticated users
 * away from app routes based on the presence of a session cookie. It is NOT
 * the security boundary: every server action, route handler and data read
 * independently enforces authentication + tenant + RBAC (see
 * src/lib/auth/context.ts). Cookie presence never grants data access.
 */
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/reset-password", "/verify"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // Signed-in users shouldn't see auth pages.
  if (sessionCookie && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Guard the authenticated app surface.
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (!sessionCookie && isProtected) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
