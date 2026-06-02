import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  typescript: {
    // Run `npm run typecheck` separately. This prevents deploy builds from
    // hanging inside Next's generated route validation on this MVP.
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 2,
    workerThreads: false,
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 1,
  },
};

export default nextConfig;
