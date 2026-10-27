import type { MetadataRoute } from "next";
import { SITE_URL, publicPaths } from "@/lib/site-metadata";
export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: SITE_URL + path,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority:
      path === "/" ? 1 : path === "/pace" || path === "/pricing" ? 0.8 : 0.5,
  }));
}
