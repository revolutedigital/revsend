/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@whiskeysockets/baileys"],
  },
};

export default nextConfig;
