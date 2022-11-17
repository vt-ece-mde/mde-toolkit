/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  serverRuntimeConfig: {
    // Will only be available on the server side
    // URI: 'your-docker-uri:port'
    API_URI: `http://${process.env.API_SERVER_HOST}:${process.env.API_SERVER_PORT}`,
    CANVAS_API_TOKEN: process.env.CANVAS_API_TOKEN,
    CANVAS_BASE_URL: "https://canvas.vt.edu/api/v1",
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    // URI: 'http://localhost:port'
    API_URI: `http://localhost:${process.env.API_SERVER_PORT}`,
    CANVAS_API_TOKEN: process.env.CANVAS_API_TOKEN,
    CANVAS_BASE_URL: "/api/canvas", // Intended to be empty.
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/mde/:path*',
        // destination: 'http://localhost:3030/:path*' // Proxy to Backend
        destination: `http://${process.env.API_SERVER_HOST}:${process.env.API_SERVER_PORT}/:path*` // Proxy to Backend
      },
      {
        source: '/api/canvas/:path*',
        destination: 'https://canvas.vt.edu/api/v1/:path*' // Proxy to Backend
      }
    ]
  }
}

module.exports = nextConfig
