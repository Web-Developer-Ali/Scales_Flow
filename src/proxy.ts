import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|css|js|ico|svg)$/)
  )
    return NextResponse.next();

  // Public pages
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  // Get JWT token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,
  });
  console.log("🟡 Proxy Token:", token);

  // Not authenticated → redirect to login
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  // Unverified users → redirect to OTP
  if (!token.isVerified) {
    const otpUrl = new URL("/otp-verification", req.url);
    if (token.email) otpUrl.searchParams.set("email", token.email);
    return NextResponse.redirect(otpUrl);
  }

  // Redirect auth pages away if logged in
  if (AUTH_PAGES.has(pathname)) {
    const role = token.role as string;
    const redirectPath =
      role === "admin"
        ? "/admin/dashboard"
        : role === "manager"
        ? "/manager/dashboard"
        : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Role-based protection
  if (pathname.startsWith("/admin") && token.role !== "admin")
    return NextResponse.redirect(new URL("/dashboard", req.url));
  if (
    pathname.startsWith("/manager") &&
    !["admin", "manager"].includes(token.role)
  )
    return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|_next/data).*)"],
};
