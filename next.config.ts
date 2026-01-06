import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbopack on Azure App Service was inferring /home/site/wwwroot/app as root.
  // Explicitly pin the project root so Next.js can resolve its own package.
  experimental: {
    turbo: {
      root: path.join(__dirname),
    },
  },
};

export default nextConfig;
