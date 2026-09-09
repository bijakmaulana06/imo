import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {},
  outputFileTracingRoot: path.resolve(__dirname),
  // Local credential notes and QA helpers must never be shipped in server bundles.
  outputFileTracingExcludes: {
    "/*": [
      "./.env*", "./.git/**/*", "./scratch/**/*", "./tests/**/*", "./certificates/**/*",
      "./SUpabase database.txt", "./s3 R2.txt", "./fcm config.txt",
    ],
  },
  async headers() {
    const headers = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      { source: "/voting/:path*", headers },
      { source: "/api/voting/:path*", headers },
      { source: "/admin/voting/:path*", headers },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          "**/.git/**",
          "**/.next/**",
          "**/node_modules/**",
          "**/certificates/**",
          "**/.gemini/**",
          "**/scratch/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
