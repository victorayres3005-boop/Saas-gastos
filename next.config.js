/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Impede o webpack de bundlar pdfjs-dist — deixa o Node.js resolver nativamente
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
}
module.exports = nextConfig
