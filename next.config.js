/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Required for NextAuth v5 in App Router
  serverExternalPackages: ["@prisma/client", "prisma"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },

  turbopack: {},

  // Silence Remotion peer dep warnings in build output
  webpack: (config) => {
    config.externals.push("@remotion/bundler");
    return config;
  },
};

module.exports = nextConfig;
