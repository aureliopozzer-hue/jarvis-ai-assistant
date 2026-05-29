import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    ".z.ai",
    "localhost",
    "preview-chat-01052e57-800c-49a0-bc19-a9bc8cbc574d.space-z.ai",
  ],
};

export default nextConfig;
