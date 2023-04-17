/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  pageExtensions: ['page.tsx', "page.ts", "page.jsx", "page.js"],
  async redirects() {
    return [{
      source: "/",
      destination: '/home',
      permanent: true,
    }]
  },
}

module.exports = nextConfig