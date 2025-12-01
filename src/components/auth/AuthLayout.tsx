'use client';

import Image from 'next/image';
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  marketingTitle: React.ReactNode;
  marketingContent: React.ReactNode;
}

export function AuthLayout({ children, marketingTitle, marketingContent }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-6 lg:p-10 bg-gradient-to-br from-zinc-50 to-zinc-100/50">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/logo.png"
              alt="Ascentful logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <h1 className="text-2xl font-semibold tracking-tight text-brand-blue">Ascentful</h1>
          </div>
          {children}
        </div>
      </div>

      {/* Right: Marketing Panel */}
      <div className="hidden lg:flex items-center justify-center p-10 bg-brand-blue">
        <div className="max-w-md text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">{marketingTitle}</h2>
          {marketingContent}
        </div>
      </div>
    </div>
  );
}
