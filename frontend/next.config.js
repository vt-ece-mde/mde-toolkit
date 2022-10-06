/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  serverRuntimeConfig: {
    // Will only be available on the server side
    // URI: 'your-docker-uri:port'
    API_URI: `http://${process.env.API_SERVER_HOST}:${process.env.API_SERVER_PORT}`,
    CANVAS_API_TOKEN: process.env.CANVAS_API_TOKEN,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    // URI: 'http://localhost:port'
    API_URI: `http://localhost:${process.env.API_SERVER_PORT}`,
    CANVAS_API_TOKEN: process.env.CANVAS_API_TOKEN,
  }
}

module.exports = nextConfig
