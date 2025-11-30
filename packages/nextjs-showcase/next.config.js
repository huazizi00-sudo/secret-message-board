/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@fhevm-sdk'],
  
  // CORS 头配置（必需 - FHEVM WebAssembly）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless', // 使用 credentialless 而不是 require-corp
          },
        ],
      },
    ];
  },
  
  // Webpack 配置（必需 - 解决 React Native 依赖问题）
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallback：忽略 React Native 依赖
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'pino-pretty': false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 抑制警告
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /@react-native-async-storage/ },
      { module: /pino-pretty/ },
    ];
    
    return config;
  },
};

module.exports = nextConfig;

