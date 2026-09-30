import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";

/**
 * Route protection.
 *
 * Runs on the edge before any page renders: unauthenticated users are sent to
 * /login with a `next` parameter, admin-only routes are blocked for seekers, and
 * already-signed-in users skip the auth screens.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/jobs",
  "/skill-gaps",
  "/training",
  "/agent",
  "/applications",
  "/map",
  "/opportunities",
  "/insights",
  "/profile",
  "/onboarding",
];

const ADMIN_PREFIXES = ["/admin"];
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const needsAuth = [...PROTECTED_PREFIXES, ...ADMIN_PREFIXES].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (needsAuth && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const needsAdmin = ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (needsAdmin && session?.role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "?denied=admin";
    return NextResponse.redirect(url);
  }

  if (session && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/skill-gaps/:path*",
    "/training/:path*",
    "/agent/:path*",
    "/applications/:path*",
    "/map/:path*",
    "/opportunities/:path*",
    "/insights/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
