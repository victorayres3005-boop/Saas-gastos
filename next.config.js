/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Impede o webpack de bundlar pdfjs-dist — deixa o Node.js resolver nativamente
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Avatares do Google (login OAuth)
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}
module.exports = nextConfig
