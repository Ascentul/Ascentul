'use client'

import { Menu, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import Link from 'next/link'

interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, subscription } = useAuth()
  const isUniversityUser = user?.role === 'university_admin' || subscription.isUniversity

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="md:hidden mr-2 text-neutral-700 p-2"
            onClick={onMenuToggle}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="md:hidden text-lg font-bold text-primary font-poppins">Ascentful</h1>
        </div>
        <div className="flex items-center">
          {/* University Toggle - only for university users */}
          {isUniversityUser && (
            <Link
              href="/university"
              className="mr-3 border border-primary rounded-md px-3 py-1.5 text-primary hover:bg-primary/5 flex items-center cursor-pointer"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">University Edition</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}