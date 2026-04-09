import type { NextConfig } from "next";

// In CI the Supabase URL may not be set when running unauthenticated E2E
// tests that don't make real Supabase API calls. Fall back to a placeholder
// so the dev server can start; image remote patterns will simply not match.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";

if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL
) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
}

const supabaseHostname = new URL(supabaseUrl).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
