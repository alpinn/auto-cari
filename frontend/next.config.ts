import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.tokopedia.com" },
      { protocol: "https", hostname: "**.shopee.co.id" },
      { protocol: "https", hostname: "**.lazada.co.id" },
      { protocol: "https", hostname: "**.blibli.com" },
      { protocol: "https", hostname: "**.serpapi.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.sstatic.net" },
      { protocol: "https", hostname: "**.gstatic.com" },
    ],
  },
};

export default nextConfig;
