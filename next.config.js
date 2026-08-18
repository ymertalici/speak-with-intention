/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@trpc/client", "@trpc/react-query", "@trpc/server", "superjson"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  
  output: "standalone",
  serverExternalPackages: ["pg"],
  experimental: { serverMinification: false },
};

module.exports = nextConfig;
