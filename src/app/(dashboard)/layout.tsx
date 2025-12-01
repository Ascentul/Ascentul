import { ReactNode } from 'react';

import { Layout } from '@/components/Layout';

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
