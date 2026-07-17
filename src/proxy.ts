import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ── Public pages — no auth needed ─────────────────────────────────────────────
const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/help",
  "/docs",
  "/blog",
  "/features",
]);

// ── Auth pages — redirect to dashboard if already logged in ───────────────────
const AUTH_PAGES = new Set([
  "/login",
  "/signup",
  "/register_admin",
  "/otp-verification",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

// ── Where each role lands after login ─────────────────────────────────────────
const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  scales_man: "/scales_man/dashboard",
};

// ── Which roles can access which route prefix ─────────────────────────────────
const ROLE_ACCESS: Record<string, string[]> = {
  "/admin": ["admin"],
  "/manager": ["manager"],
  "/scales_man": ["scales_man"],
};

// ── Pages that require email verification ─────────────────────────────────────
// All protected routes require verification — unverified users go to OTP page
const VERIFY_EXEMPT = new Set(["/otp-verification", "/login", "/logout"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip Next.js internals and static files — matcher handles most of this
  //    but double-check for safety
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|json)$/i.test(
      pathname,
    )
  ) {
    return NextResponse.next();
  }

  // 2. Always allow API routes — API handlers do their own auth checks
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 3. Allow pure public pages immediately
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // 4. Get JWT token
  let token: Awaited<ReturnType<typeof getToken>>;
  try {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
    });
    // token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 5. Handle auth pages (login, signup, etc.)
  //    Logged-in users should not see most auth pages — except forced reset.
  if (AUTH_PAGES.has(pathname)) {
    if (token) {
      if (
        pathname === "/reset-password" &&
        token.must_reset_password === true
      ) {
        return NextResponse.next();
      }

      const role = token.role as string;
      const dashboard = ROLE_DASHBOARDS[role] ?? "/login";
      return NextResponse.redirect(new URL(dashboard, req.url));
    }
    return NextResponse.next();
  }

  // 6. Everything below this line requires authentication
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    // Preserve full path + query so user returns to where they were
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;
  const isVerified = token.is_verified as boolean;
  const isActive = token.is_active as boolean;

  // 7. Blocked users — force logout regardless of where they are
  if (isActive === false) {
    const logoutUrl = new URL("/login", req.url);
    logoutUrl.searchParams.set("error", "account_blocked");
    // Clear session cookie by redirecting — actual cookie clearing
    // happens in the login page when it reads the error param
    const res = NextResponse.redirect(logoutUrl);
    res.cookies.delete("next-auth.session-token");
    res.cookies.delete("__Secure-next-auth.session-token");
    return res;
  }

  // 8. Unverified users — redirect to OTP verification
  //    unless they're already on the verification page
  if (isVerified === false && !VERIFY_EXEMPT.has(pathname)) {
    const verifyUrl = new URL("/otp-verification", req.url);
    verifyUrl.searchParams.set("email", (token.email as string) ?? "");
    return NextResponse.redirect(verifyUrl);
  }

  // 9. Force password reset — admin created users must set their own password
  if (
    token.must_reset_password === true &&
    pathname !== "/reset-password" &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/profile")
  ) {
    const resetUrl = new URL("/reset-password", req.url);
    resetUrl.searchParams.set("forced", "true");
    return NextResponse.redirect(resetUrl);
  }

  // 10. Role-based access control
  //    Check each protected prefix and enforce role
  for (const [prefix, allowedRoles] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(role)) {
        const dashboard = ROLE_DASHBOARDS[role] ?? "/login";
        return NextResponse.redirect(new URL(dashboard, req.url));
      }
      // Correct role — allow through
      return NextResponse.next();
    }
  }

  // 11. Authenticated but no specific role restriction — allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - static file extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
