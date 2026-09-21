import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @fithub/shared-types (packages/shared-types) é distribuído como TS
  // fonte, sem build próprio — precisa passar pelo compilador do Next
  // igual ao resto do app, não como um pacote de node_modules já pronto.
  transpilePackages: ['@fithub/shared-types'],
};

export default nextConfig;
