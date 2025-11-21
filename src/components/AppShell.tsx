'use client'

import { ReactNode } from 'react'
import { NotificationButtons } from '@/components/layout/NotificationButtons'

interface AppShellProps {
  sidebar: ReactNode
  children: ReactNode
}

/**
 * AppShell - Modern rounded dashboard shell component
 *
 * Creates a floating card design with:
 * - Full-width layout with sidebar as part of background card
 * - Main content area floats on top of the sidebar area
 * - Light neutral background for the entire viewport
 *
 * This component wraps all authenticated pages to provide consistent
 * modern SaaS styling inspired by Finovia design patterns.
 */
export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen gap-3 bg-[#F1F3F9]">
      {/* Sidebar - lives on grey background, sticky position */}
      <aside className="sticky top-0 hidden h-screen md:block">
        {sidebar}
      </aside>

      {/* Main Content Area - white card floating on top of grey background, scrollable */}
      <main className="min-h-screen flex-1 pl-0 pr-6 py-6 transition-all duration-300 ease-in-out">
        {/* Notification buttons - fixed position in top right of main content area */}
        <div className="fixed top-2 right-12 z-10">
          <NotificationButtons />
        </div>

        <div className="mx-auto mt-2 rounded-3xl bg-white p-6 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  )
}
