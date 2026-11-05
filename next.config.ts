import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/board", destination: "/jobs", permanent: true }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [420, 640, 828, 1200, 1600],
  },
};

export default nextConfig;
