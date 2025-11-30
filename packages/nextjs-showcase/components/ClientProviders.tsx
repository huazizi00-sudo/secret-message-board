'use client';

import dynamic from 'next/dynamic';

const Providers = dynamic(
  () => import('./Providers').then((mod) => mod.Providers),
  { ssr: false } // 关键：禁用 SSR
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}

