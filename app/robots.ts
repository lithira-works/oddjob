import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/job", "/jobs", "/workers", "/deals", "/trades/", "/pros/", "/login", "/signup", "/verify", "/feedback"] },
  };
}
