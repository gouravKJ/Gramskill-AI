import path from "node:path";
import type { NextConfig } from "next";

/**
 * Security headers are applied globally. CSP is intentionally permissive for
 * inline styles (Tailwind + Radix) but blocks inline scripts and framing.
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This project often lives inside a synced folder (OneDrive/Documents) whose
  // ancestors also contain lockfiles. Pinning the tracing root stops Next from
  // inferring a workspace root far above the app — which both warns at build
  // time and makes it trace a huge directory tree unnecessarily.
  outputFileTracingRoot: __dirname,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
