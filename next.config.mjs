/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig
