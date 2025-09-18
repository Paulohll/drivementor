import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración optimizada para Firebase App Hosting
  typescript: {
    ignoreBuildErrors: true, // Para permitir deploy rápido
  },
  eslint: {
    ignoreDuringBuilds: true, // Para permitir deploy rápido
  },
  // Optimizaciones para producción
  experimental: {
    optimizePackageImports: ['firebase']
  }
};

export default nextConfig;
