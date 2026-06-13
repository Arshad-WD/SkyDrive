import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("skydrive_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboardPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/files") ||
    pathname.startsWith("/trash") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/settings");

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not logged in and tries to access protected pages, redirect to login
  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Also redirect bare root path to dashboard if logged in, else to login
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/files/:path*",
    "/trash/:path*",
    "/activity/:path*",
    "/settings/:path*",
  ],
};
