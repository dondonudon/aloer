import type { NextConfig } from "next";

if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL
) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
}

const nextConfig: NextConfig = {
  // Don't advertise the framework version to the outside world.
  poweredByHeader: false,

  // Ensure gzip compression is active on self-hosted deployments that don't
  // sit behind a reverse-proxy that handles compression.
  compress: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        // Allow any Supabase project storage bucket.
        // The hostname is *.supabase.co so it works regardless of which
        // project ref is active (including CI with no env vars set).
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Prefer AVIF (smallest), fall back to WebP for browsers that don't support it.
    formats: ["image/avif", "image/webp"],
    // Cache optimised images for 30 days on Vercel's CDN.
    // Static assets like logos rarely change; this avoids re-optimising on
    // every cold-start and dramatically improves repeat-visit LCP.
    minimumCacheTTL: 2592000,
  },
};

export default nextConfig;
