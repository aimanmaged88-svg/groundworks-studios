import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321").hostname;
  } catch {
    return "127.0.0.1";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: supabaseHost }, { protocol: "http", hostname: "127.0.0.1" }],
  },
  // exceljs and stripe are server-only and heavy; keep them out of the client bundle analysis
  serverExternalPackages: ["exceljs", "stripe"],
};

export default nextConfig;
