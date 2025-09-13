'use client'

import { ReactNode, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2, Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'

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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile menu toggle (floating) - replaces removed top bar */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Button
          variant="ghost"
          className="text-neutral-700 p-2"
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
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={mobileSidebarOpen} onToggle={toggleMobileSidebar} />
        <div className="flex-1 overflow-auto">
          <main className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}