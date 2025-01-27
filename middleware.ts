import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROUTES = [
  "/api/users",
  "/api/documents",
  "/api/export/farmers",
  "/admindashboard",
];
const PROTECTED_ROUTES = ["/api/farmers", "/api/test", "/dashboard"];

export async function middleware(request: NextRequest) {
  try {
    console.log("Middleware:", request.nextUrl.pathname);
    const isAdminRoute = ADMIN_ROUTES.some(route =>
      request.nextUrl.pathname.startsWith(route)
    );
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
      request.nextUrl.pathname.startsWith(route)
    );

    if (!isAdminRoute && !isProtectedRoute) {
      return NextResponse.next();
    }

    const session = request.cookies.get("session");

    if (!session) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    const sessionData = JSON.parse(session.value);

    if (sessionData.exp < Date.now()) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    if (isAdminRoute && sessionData.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", sessionData.userId.toString());
    requestHeaders.set("x-user-role", sessionData.role);

    console.log("Ending middleware");
    return NextResponse.next({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    "/api/users/:path*",
    "/api/farmers/:path*",
    "/api/test",
    "/api/documents/:path*",
    "/api/export/farmers/:path*",
    "/dashboard",
    "/admindashboard"
  ],
};
