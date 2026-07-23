/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000/api/v1',
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;

