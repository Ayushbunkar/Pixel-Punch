import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Content Security Policy (CSP)
  // Restricts script, style, image, and connection sources to minimize XSS vectors
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com;
    frame-ancestors 'self' https://pixelpunch.org;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // 2. Prevent clickjacking (X-Frame-Options)
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // 3. Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 4. Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 5. Enforce HTTPS (HTTP Strict Transport Security)
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // 6. X-XSS-Protection (Legacy filter enablement)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

// Apply proxy matcher to all routes except assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/production-static (static assets)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
