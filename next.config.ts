import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // 图片优化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      }
    ],
    // 优化图片格式
    formats: ['image/avif', 'image/webp'],
    // 启用图片优化
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 编译优化
  compiler: {
    // 移除console.log (仅生产环境)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Turbopack配置（现在是稳定功能）
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // 外部包配置（服务器端）
  serverExternalPackages: [
    'three',
    'jspdf',
  ],

  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: [
      'react-icons',
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      '@langchain/core',
      '@langchain/community',
    ],
    viewTransition: true,
  },

  // Webpack优化暂时禁用，避免构建错误

  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  
  // 启用gzip压缩
  compress: true,

  // PoweredByHeader
  poweredByHeader: false,

  // React严格模式
  reactStrictMode: true,

  // 生产环境源码映射（调试用，可关闭以减小体积）
  productionBrowserSourceMaps: false,

  // SWC minification 现在是默认启用的，无需显式配置

  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    BACKEND_URL: process.env.BACKEND_URL,
  },

  // 接口转发 (Proxy)
  async rewrites() {
    return [
      {
        source: '/api/interview/:path*',
        destination: (process.env.BACKEND_URL || 'http://localhost:8000') + '/api/interview/:path*',
      },
    ];
  }
};

export default nextConfig;
