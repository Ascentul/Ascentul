'use client'

import { ReactNode, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2, Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import AppTopBar from '@/components/layout/AppTopBar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, isLoaded } = useUser()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen)
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <>
      {/* Mobile menu toggle (floating) - only visible on mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          className="shadow-lg bg-white"
          aria-label="Open sidebar menu"
          onClick={toggleMobileSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile overlay backdrop - only visible when mobile sidebar is open */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar (drawer) - only on mobile */}
      <div className="md:hidden">
        <Sidebar isOpen={mobileSidebarOpen} onToggle={toggleMobileSidebar} />
      </div>

      {/* Desktop & main layout */}
      <div className="flex min-h-screen bg-app-bg">
        {/* Sidebar - desktop */}
        <aside className="hidden md:sticky md:top-0 md:h-screen md:block">
          <Sidebar />
        </aside>

        {/* Main column with top bar and content */}
        <div className="flex flex-1 flex-col">
          <AppTopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="w-full px-4 md:px-6 space-y-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
