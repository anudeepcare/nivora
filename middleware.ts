import { NextResponse, type NextRequest } from "next/server";
import { isProductPage } from "./lib/page-routing";
/** Emit an actual 404 before App Router streaming can commit a 200 response. */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/api/") ||
    path === "/api" ||
    path.startsWith("/_next/") ||
    path === "/opengraph-image" ||
    /\.[^/]+$/.test(path) ||
    isProductPage(path)
  )
    return NextResponse.next();
  // Existing redirects are applied by Next before middleware; no user data is reflected in this response.
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Page not found · AURYN</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f7fc;color:#17243b;font:16px system-ui}main{max-width:520px;padding:36px}small{letter-spacing:3px;color:#385cdf;font-weight:700}h1{font-size:42px;letter-spacing:-1px}p{color:#5f6c80;line-height:1.7}a{display:inline-block;background:#385cdf;color:white;padding:13px 20px;border-radius:10px;text-decoration:none;margin-top:14px}</style></head><body><main><small>AURYN · 404</small><h1>This page isn't here.</h1><p>The address may have changed. Return to AURYN to continue your research.</p><a href="/">Back to AURYN</a></main></body></html>`,
    {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
export const config = { matcher: ["/:path*"] };
