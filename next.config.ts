// import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // ✅ ESLint 오류 무시
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ TypeScript 오류 무시
  },
};

export default nextConfig;
