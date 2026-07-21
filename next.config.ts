import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prefer this package as Turbopack root when parent dirs have lockfiles.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
