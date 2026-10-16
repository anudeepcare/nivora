import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest {
  return {
    name: "AURYN — Investment Intelligence",
    short_name: "AURYN",
    description: "Evidence-first investment intelligence for stocks, crypto and portfolios.",
    start_url: "/analyze",
    display: "standalone",
    background_color: "#f4f7fc",
    theme_color: "#071321",
    icons: [
      {src: "/auryn-192.png", sizes: "192x192", type: "image/png", purpose: "maskable"},
      {src: "/auryn-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"},
    ],
  };
}
