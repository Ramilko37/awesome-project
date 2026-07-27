import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";
const distDir = process.env.FORTIS_NEXT_DIST_DIR?.trim() || undefined;
const fortisApiBaseUrl =
  process.env.FORTIS_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_FORTIS_API_BASE_URL?.trim() ||
  "http://localhost:8090";

const nextConfig: NextConfig = {
  distDir,
  turbopack: {
    root: frontendRoot,
  },
  output: isStaticExport ? "export" : undefined,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath || undefined,
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/drone-defense/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    if (isStaticExport) return [];
    return {
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${fortisApiBaseUrl}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
