/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@anthropic-ai/sdk',
      '@neondatabase/serverless',
    ],
  },
}

export default nextConfig
