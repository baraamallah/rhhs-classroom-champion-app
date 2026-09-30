import os from 'os'

const localIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((net) => net && net.family === 'IPv4' && !net.internal)
  .map((net) => net.address)

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    ...localIps,
    ...localIps.map((ip) => `${ip}:3000`),
    '192.168.10.57',
    'localhost:3000',
  ],
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
