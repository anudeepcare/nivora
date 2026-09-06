import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest {
  return {
    name: "AURYN — Investment Intelligence",
    short_name: "AURYN",
    description: "Evidence-first investment intelligence for stocks, crypto and portfolios.",
    start_url: "/analyze",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#15130f",
    icons: [
      {src: "/auryn-v38-192.png", sizes: "192x192", type: "image/png", purpose: "maskable"},
      {src: "/auryn-v38-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"},
    ],
  };
}
