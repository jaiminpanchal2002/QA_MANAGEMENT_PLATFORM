import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware for coarse route protection.
 *
 * This is an optimization / UX guard only — it redirects based on the mere
 * PRESENCE of a session cookie. It is NOT the security boundary: every server
 * action, route handler and data read independently enforces authentication +
 * tenant + RBAC (see src/lib/auth/context.ts). Cookie presence never grants
 * data access.
 *
 * It intentionally does NOT import Better Auth: pulling the auth/JWT modules
 * into the Edge bundle drags in Node-only APIs (CompressionStream) that the
 * Edge runtime doesn't support. Checking for the session cookie by name keeps
 * the middleware pure and Edge-safe.
 */
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/reset-password", "/verify"];

// Better Auth default session cookie is "better-auth.session_token"; in
// production (secure cookies) it is prefixed with "__Secure-".
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => {
    const value = request.cookies.get(name)?.value;
    return typeof value === "string" && value.length > 0;
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSessionCookie(request);
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // Signed-in users shouldn't see auth pages.
  if (authed && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Guard the authenticated app surface.
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (!authed && isProtected) {
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
