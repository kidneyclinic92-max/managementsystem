import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

// CORS: allow local dev origins (Expo web runs on 8081 by default)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
];

function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  return res;
}

const unprotectedRoutes = ["/login", "/api/auth/login", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle CORS for API routes (including preflight)
  if (pathname.startsWith("/api")) {
    if (req.method === "OPTIONS") {
      // Preflight response
      return applyCors(
        req,
        new NextResponse(null, {
          status: 204,
        })
      );
    }
    // For actual API requests, add CORS headers and continue
    return applyCors(req, NextResponse.next());
  }

  const isUnprotected = unprotectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isUnprotected || pathname.startsWith("/_next") || pathname === "/") {
    if (pathname === "/" && !(await isAuthenticated(req))) {
      return redirectToLogin(req);
    }
    if (isUnprotected) {
      return NextResponse.next();
    }
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname === "/"
  ) {
    const authenticated = await isAuthenticated(req);
    if (!authenticated) {
      return redirectToLogin(req);
    }
  }

  return NextResponse.next();
}

async function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return false;

  const payload = await verifyAuthToken(token);
  return Boolean(payload);
}

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("auth_token");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

