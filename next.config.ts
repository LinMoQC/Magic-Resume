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

  // 实验性功能
  experimental: {
    // 启用turbopack（开发时）
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // 优化包导入
    optimizePackageImports: [
      'react-icons',
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      '@langchain/core',
      '@langchain/community',
    ],
    // 启用并发功能
    serverComponentsExternalPackages: [
      'langchain',
      '@langchain/core',
      '@langchain/community',
      '@langchain/anthropic',
      '@langchain/google-genai',
      'three',
      'jspdf',
    ],
  },

  // Webpack优化
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev) {
      // 代码分割优化
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // AI相关库单独打包
            ai: {
              test: /[\\/]node_modules[\\/](@langchain|langchain|ai)[\\/]/,
              name: 'ai-libs',
              chunks: 'all',
              priority: 30,
            },
            // 3D相关库单独打包
            three: {
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              name: 'three-libs',
              chunks: 'all',
              priority: 25,
            },
            // 编辑器相关库单独打包
            editor: {
              test: /[\\/]node_modules[\\/](@tiptap|@editorjs|@monaco-editor)[\\/]/,
              name: 'editor-libs',
              chunks: 'all',
              priority: 20,
            },
            // UI组件库单独打包
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|framer-motion)[\\/]/,
              name: 'ui-libs',
              chunks: 'all',
              priority: 15,
            },
            // 图标库单独打包
            icons: {
              test: /[\\/]node_modules[\\/](react-icons|lucide-react|@radix-ui\/react-icons)[\\/]/,
              name: 'icon-libs',
              chunks: 'all',
              priority: 10,
            },
            // 默认vendor
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 5,
            },
          },
        },
      };

      // 压缩优化
      config.optimization.minimize = true;
    }

    // 别名配置，加速构建
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };

    // 忽略一些不必要的模块
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },

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

  // 只在需要时导入polyfills
  swcMinify: true,

  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
