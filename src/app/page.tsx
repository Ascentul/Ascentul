'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to sign-in page (matching current behavior)
    router.push('/sign-in')
  }, [router])

  return null
}