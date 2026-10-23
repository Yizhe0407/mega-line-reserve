import type { NextConfig } from "next";

const internalApiUrl = (
  process.env.INTERNAL_API_URL?.trim() || "http://127.0.0.1:3001"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Node 24 會優先解析 module-sync；將 SWC 的 ESM helper 納入 standalone 產物。
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/esm/**/*",
    ],
  },

  // 同源 /api 由 Next.js 伺服器轉發；INTERNAL_API_URL 不會輸出到瀏覽器。
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
