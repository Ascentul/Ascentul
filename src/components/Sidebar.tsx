'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  Mail, 
  UserRound, 
  Briefcase, 
  Trophy, 
  Bot, 
  Settings, 
  LogOut,
  GraduationCap,
  BookOpen,
  School,
  ShieldCheck,
  GitBranch,
  Linkedin,
  FolderGit2,
  Search,
  ChevronRight,
  LineChart,
  BarChart,
  ClipboardList,
  Clock,
  Building,
  Calendar,
  FileEdit,
  PanelLeft,
  PanelRight,
  ChevronsLeft,
  Menu,
  User as UserIcon,
  Mic,
  HelpCircle,
  Bell,
  Zap
} from 'lucide-react'

// Sidebar section types
type SidebarSection = {
  id: string
  title: string
  icon: React.ReactNode
  items?: SidebarItem[]
  href?: string
}

type SidebarItem = {
  href: string
  icon: React.ReactNode
  label: string
  pro?: boolean
}

interface SidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const { user, signOut, isAdmin } = useAuth()
  const isUniversityUser = user?.role === 'university_admin' || user?.subscription_plan === 'university'
  
  // Check if user is on free plan and not a university admin or premium user
  const isFreeUser = user?.subscription_plan === 'free' && user?.role !== 'university_admin'
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [hoverSection, setHoverSection] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('sidebarExpanded') !== 'false' : true
  )
  const [menuPositions, setMenuPositions] = useState<Record<string, number>>({})
  
  // Support ticket related state
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState('Other')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Define sidebar sections
  const sidebarSections: SidebarSection[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/dashboard'
    },
    {
      id: 'career-development',
      title: 'Career Development',
      icon: <Target className="h-5 w-5" />,
      items: [
        { href: '/goals', icon: <Target className="h-4 w-4" />, label: 'Goals' },
        { href: '/career-path', icon: <GitBranch className="h-4 w-4" />, label: 'Career Path Explorer' },
        { href: '/ai-coach', icon: <Bot className="h-4 w-4" />, label: 'AI Career Coach', pro: true },
      ]
    },
    {
      id: 'job-search',
      title: 'Job Search',
      icon: <Search className="h-5 w-5" />,
      items: [
        { href: '/job-search', icon: <Search className="h-4 w-4" />, label: 'Job Search' },
        { href: '/applications', icon: <ClipboardList className="h-4 w-4" />, label: 'Application Tracker' },
        { href: '/interviews', icon: <Calendar className="h-4 w-4" />, label: 'Interview Tracker' },
      ]
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: <FileText className="h-5 w-5" />,
      items: [
        { href: '/resumes', icon: <FileText className="h-4 w-4" />, label: 'Resumes' },
        { href: '/cover-letters', icon: <Mail className="h-4 w-4" />, label: 'Cover Letter Coach' },
        { href: '/projects', icon: <FolderGit2 className="h-4 w-4" />, label: 'Project Portfolio' },
      ]
    },
    {
      id: 'networking',
      title: 'Networking',
      icon: <UserRound className="h-5 w-5" />,
      items: [
        { href: '/contacts', icon: <UserRound className="h-4 w-4" />, label: 'Network Hub' },
        { href: '/linkedin', icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn Integration', pro: true },
      ]
    },
    {
      id: 'achievements',
      title: 'Achievements',
      icon: <Trophy className="h-5 w-5" />,
      href: '/achievements'
    }
  ]

  // Admin sections
  const adminSections: SidebarSection[] = [
    {
      id: 'admin',
      title: 'Admin',
      icon: <ShieldCheck className="h-5 w-5" />,
      items: [
        { href: '/admin', icon: <ShieldCheck className="h-4 w-4" />, label: 'Admin Dashboard' },
        { href: '/admin/users', icon: <UserIcon className="h-4 w-4" />, label: 'User Management' },
        { href: '/admin/analytics', icon: <BarChart className="h-4 w-4" />, label: 'Analytics' },
        { href: '/admin/support', icon: <HelpCircle className="h-4 w-4" />, label: 'Support Tickets' },
      ]
    }
  ]

  // University sections
  const universitySections: SidebarSection[] = [
    {
      id: 'university',
      title: 'University',
      icon: <GraduationCap className="h-5 w-5" />,
      items: [
        { href: '/university', icon: <School className="h-4 w-4" />, label: 'University Dashboard' },
        { href: '/university/courses', icon: <BookOpen className="h-4 w-4" />, label: 'Course Management' },
        { href: '/university/students', icon: <UserIcon className="h-4 w-4" />, label: 'Student Progress' },
      ]
    }
  ]

  // Combine sections based on user role
  const allSections = [
    ...sidebarSections,
    ...(isUniversityUser ? universitySections : []),
    ...(isAdmin ? adminSections : [])
  ]

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleSupportSubmit = async () => {
    if (!subject.trim() || !description.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          description,
          issueType,
          source: 'sidebar'
        }),
      })

      if (response.ok) {
        setShowSupportModal(false)
        setSubject('')
        setDescription('')
        setIssueType('Other')
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleExpanded = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarExpanded', newExpanded.toString())
    }
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderSidebarItem = (item: SidebarItem) => {
    const active = isActive(item.href)
    const disabled = item.pro && isFreeUser

    return (
      <Link
        key={item.href}
        href={disabled ? '#' : item.href}
        className={`
          flex items-center px-3 py-2 text-sm rounded-md transition-colors relative
          ${active 
            ? 'bg-primary/10 text-primary border-r-2 border-primary' 
            : disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
      >
        <span className="mr-3">{item.icon}</span>
        {expanded && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.pro && isFreeUser && (
              <Zap className="h-3 w-3 text-yellow-500" />
            )}
          </>
        )}
      </Link>
    )
  }

  const renderSection = (section: SidebarSection) => {
    const hasItems = section.items && section.items.length > 0
    const sectionActive = section.href ? isActive(section.href) : false

    if (!hasItems && section.href) {
      // Single item section
      return (
        <Link
          key={section.id}
          href={section.href}
          className={`
            flex items-center px-3 py-2 text-sm rounded-md transition-colors
            ${sectionActive 
              ? 'bg-primary/10 text-primary border-r-2 border-primary' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }
          `}
        >
          <span className="mr-3">{section.icon}</span>
          {expanded && <span>{section.title}</span>}
        </Link>
      )
    }

    // Section with items
    return (
      <div key={section.id} className="space-y-1">
        <div className="flex items-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span className="mr-3">{section.icon}</span>
          {expanded && <span>{section.title}</span>}
        </div>
        {hasItems && section.items?.map(renderSidebarItem)}
      </div>
    )
  }

  return (
    <>
      <div
        ref={sidebarRef}
        className={`
          bg-white shadow-lg transition-all duration-300 ease-in-out z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${expanded ? 'w-64' : 'w-16'}
          md:translate-x-0 md:static md:inset-0
          fixed inset-y-0 left-0 flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {expanded && (
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">Ascentul</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            className="hidden md:flex"
          >
            {expanded ? <ChevronsLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Profile */}
        {clerkUser && (
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonTrigger: 'h-10 w-10',
                      userButtonAvatarBox: 'h-10 w-10',
                      avatarBox: 'h-10 w-10',
                      userButtonBox: 'h-10 w-10',
                    },
                  }}
                />
              </div>
              {expanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.subscription_plan || 'free'} plan
                  </p>
                </div>
              )}
            </div>
            {expanded && isFreeUser && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Free Plan</span>
                  <span>3/5 goals</span>
                </div>
                <Progress value={60} className="h-2" />
                <Link
                  href="/upgrade"
                  className="text-xs text-primary hover:underline mt-1 block"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {allSections.map(renderSection)}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-2">
          <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-gray-900"
              >
                <HelpCircle className="h-4 w-4 mr-3" />
                {expanded && <span>Support</span>}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact Support</DialogTitle>
                <DialogDescription>
                  Describe your issue and we'll help you resolve it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Issue Type</label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bug">Bug Report</SelectItem>
                      <SelectItem value="Feature">Feature Request</SelectItem>
                      <SelectItem value="Account">Account Issue</SelectItem>
                      <SelectItem value="Billing">Billing Question</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide details about your issue"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleSupportSubmit}
                  disabled={isSubmitting || !subject.trim() || !description.trim()}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link
            href="/account"
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Settings className="h-4 w-4 mr-3" />
            {expanded && <span>Settings</span>}
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-3" />
            {expanded && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  )
}