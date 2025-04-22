import React from 'react';
import Layout from '@/components/Layout';

interface PrivateLayoutProps {
  children: React.ReactNode;
}

const PrivateLayout: React.FC<PrivateLayoutProps> = ({ children }) => {
  return <Layout>{children}</Layout>;
};

export default PrivateLayout;