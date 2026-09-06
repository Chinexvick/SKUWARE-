import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@/lib/auth/jwt";
import { DASHBOARD_ACCESS, ROLE_DASHBOARD_PATH } from "@/lib/auth/rbac";

// React dev mode (Fast Refresh) needs 'unsafe-eval'; production never does.
const scriptSrc =
  process.env.NODE_ENV === "production" ? "script-src 'self' 'unsafe-inline';" : "script-src 'self' 'unsafe-inline' 'unsafe-eval';";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "Content-Security-Policy": `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
};

function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

const PUBLIC_PATHS = ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];

/** CSRF defense for cookie-authenticated mutations: same-origin check on state-changing methods. */
function isCrossOriginMutation(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;
  if (!req.nextUrl.pathname.startsWith("/api/")) return false;

  const origin = req.headers.get("origin");
  if (!origin) return false; // same-origin requests from browsers normally send Origin on mutations; absence is suspicious but not blocked here to allow server-to-server/test tooling.

  const appUrl = process.env.APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  try {
    const originHost = new URL(origin).host;
    const appHost = new URL(appUrl).host;
    return originHost !== appHost && originHost !== req.nextUrl.host;
  } catch {
    return true;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isCrossOriginMutation(req)) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 }),
    );
  }

  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
    const claims = token ? await verifyAccessToken(token) : null;

    if (!claims) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    const prefix = Object.keys(DASHBOARD_ACCESS).find((p) => pathname.startsWith(p));
    if (prefix && !DASHBOARD_ACCESS[prefix].includes(claims.role)) {
      return withSecurityHeaders(NextResponse.redirect(new URL(ROLE_DASHBOARD_PATH[claims.role], req.url)));
    }
  }

  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    const token = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
    const claims = token ? await verifyAccessToken(token) : null;
    if (claims && (pathname === "/login" || pathname === "/signup")) {
      return withSecurityHeaders(NextResponse.redirect(new URL(ROLE_DASHBOARD_PATH[claims.role], req.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/verify-email", "/api/:path*"],
};
