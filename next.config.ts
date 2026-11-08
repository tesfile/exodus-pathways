import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Keep build tracing inside this project on Windows; the parent workspace is
  // intentionally not part of the deployable Exodus application.
  outputFileTracingRoot: __dirname
};

export default nextConfig;
