import type { NextConfig } from "next";

function supabaseHost(): string | null {
  try {
    return new URL(process.env.SUPABASE_URL || "").hostname;
  } catch {
    return null;
  }
}

const host = supabaseHost();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: host
      ? [{ protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;