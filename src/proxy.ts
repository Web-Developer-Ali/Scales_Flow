import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ===== CONFIGURATION =====
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/otp-verification",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/help",
  "/docs",
  "/blog",
  "/features",
];

const AUTH_PAGES = new Set([
  "/login",
  "/signup",
  "/otp-verification",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

// Role-based dashboard mapping
const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  scales_man: "/scales_man/dashboard",
};

// ✅ Define which roles can access which route prefixes
const ROLE_ACCESS: Record<string, string[]> = {
  "/admin": ["admin"],
  "/manager": ["manager"],
  "/scales_man": ["scales_man"],
};

// ===== MIDDLEWARE =====
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/assets") ||
    /\.(png|jpg|jpeg|gif|webp|svg|css|js|ico|woff|woff2|ttf|json)$/i.test(
      pathname
    )
  ) {
    return NextResponse.next();
  }

  // 2. Always allow API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 3. Check if it's a public non-auth page
  const isPublicNonAuthPage = PUBLIC_PATHS.some(
    (path) =>
      !AUTH_PAGES.has(path) &&
      (pathname === path || pathname.startsWith(path + "/"))
  );

  if (isPublicNonAuthPage) {
    return NextResponse.next();
  }

  // 4. Get authentication token
  let token;
  try {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (error) {
    console.error("❌ Middleware: Error getting token:", error);
    if (!AUTH_PAGES.has(pathname)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  console.log("🔍 Middleware:", {
    path: pathname,
    hasToken: !!token,
    role: token?.role,
  });

  // 5. Handle auth pages
  if (AUTH_PAGES.has(pathname)) {
    if (token) {
      const role = token.role as string;
      const dashboardPath = ROLE_DASHBOARDS[role] || "/dashboard";
      console.log(
        "✅ Authenticated user on auth page, redirecting to:",
        dashboardPath
      );
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }
    return NextResponse.next();
  }

  // 6. Not authenticated → redirect to login
  if (!token) {
    console.log("❌ Unauthenticated user, redirecting to login");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. ✅ NEW: Role-based access control with strict enforcement
  const role = token.role as string;

  // Check each protected route prefix
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(role)) {
        // User doesn't have access to this route
        const dashboardPath = ROLE_DASHBOARDS[role] || "/dashboard";
        console.log(
          `❌ Role '${role}' denied access to '${routePrefix}', redirecting to:`,
          dashboardPath
        );
        return NextResponse.redirect(new URL(dashboardPath, req.url));
      }
      // User has access
      console.log(`✅ Role '${role}' granted access to '${routePrefix}'`);
      return NextResponse.next();
    }
  }

  // 8. Allow access to other routes (like shared pages, profile, etc.)
  console.log("✅ Allowing access to shared route:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
