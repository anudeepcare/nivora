import type { NextConfig } from "next";
const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/analyze", destination: "/research", permanent: false },
      {
        source: "/stock/:symbol",
        destination: "/research/:symbol",
        permanent: false,
      },
      { source: "/home", destination: "/overview", permanent: false },
      { source: "/saved", destination: "/watchlist", permanent: false },
      {
        source: "/personalization",
        destination: "/settings",
        permanent: false,
      },
      { source: "/profile", destination: "/settings", permanent: false },
      { source: "/faq", destination: "/help", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
