import type { NextConfig } from "next";

if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL
) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
}

const nextConfig: NextConfig = {
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
  },
};

export default nextConfig;
