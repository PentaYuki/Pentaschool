/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'bullmq',
    'ioredis',
    'jsonwebtoken',
    'bcryptjs',
    '@node-rs/bcrypt',
  ],
  allowedDevOrigins: [
    "100.115.158.11",
    "localhost",
    "192.168.1.23",
    "192.168.1.0/24",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "169.254.83.107",
    "169.254.0.0/16"
  ],
  outputFileTracingExcludes: {
    "/*": [
      "./backup/**",
      "./md_fil/**",
      "./prisma/dev.db",
      "./prisma/prisma/**",
      "./public/uploads/**",
      "./public/videos/**",
      "./public/interactive/**",
      "./response*.json",
      "./src/app.rar",
      "./*.zip",
      "./*.pdf",
      "./*.docx",
      "./test_upload.docx"
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async headers() {
    // KaTeX and Fabric.js require eval() — keep 'unsafe-eval' in production too
    const scriptSrc = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:;";

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https: http: data: blob:;",
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https:;",
              "img-src 'self' data: blob: https: http:;",
              "font-src 'self' data: https:;",
              "connect-src 'self' https: http: wss: ws:;",
              "frame-src 'self' https: http: data: blob:;",
              "object-src 'none';",
              "base-uri 'self';",
              "frame-ancestors 'self';",
            ].join(' '),
          },
        ],
      },
    ];
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Ensure CSS from node_modules is properly handled
    if (!isServer) {
      // In some webpack modes splitChunks can be disabled (boolean false)
      if (!config.optimization) {
        config.optimization = {};
      }
      if (!config.optimization.splitChunks || config.optimization.splitChunks === false) {
        config.optimization.splitChunks = { cacheGroups: {} };
      }
      if (!config.optimization.splitChunks.cacheGroups) {
        config.optimization.splitChunks.cacheGroups = {};
      }

      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        katex: {
          test: /[\\/]node_modules[\\/]katex[\\/]/,
          name: 'katex',
          priority: 10,
          reuseExistingChunk: true,
        },
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
