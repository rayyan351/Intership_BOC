/** @type {import('next').NextConfig} */

// Root backend origin, no '/api' suffix. Falls back to deriving it from the
// API URL so a missing NEXT_PUBLIC_BACKEND_URL cannot silently point at
// localhost from a production build.
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")
).replace(/\/$/, "");

// Images are normally served host-relative through the /uploads rewrite below,
// so no remote pattern is needed for them. This entry is a safety net for any
// absolute backend URL that still reaches next/image.
const backendPattern = (() => {
  try {
    const { protocol, hostname, port } = new URL(BACKEND_URL);
    return [{
      protocol: protocol.replace(":", ""),
      hostname,
      ...(port ? { port } : {}),
      pathname: "/uploads/**",
    }];
  } catch {
    return [];
  }
})();

const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    minimumCacheTTL: 3600,
    remotePatterns: [
      ...backendPattern,
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
