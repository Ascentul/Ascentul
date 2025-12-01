'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in page (matching current behavior)
    router.push('/sign-in');
  }, [router]);

  return null;
}
