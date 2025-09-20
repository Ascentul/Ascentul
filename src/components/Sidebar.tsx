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
  // Persisted collapsed state per section id
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sidebarCollapsedSections')
        return saved ? JSON.parse(saved) : {}
      } catch {}
    }
    return {}
  })
  
  // Support ticket related state
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState('Other')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Upsell modal for Pro-only features
  const [showUpsellModal, setShowUpsellModal] = useState(false)

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
    
  ]

  // Admin sections (top-level for super admins)
  const adminSections: SidebarSection[] = [
    {
      id: 'admin-dashboard',
      title: 'Admin Dashboard',
      icon: <ShieldCheck className="h-5 w-5" />,
      href: '/admin'
    },
    {
      id: 'user-management',
      title: 'User Management',
      icon: <UserIcon className="h-5 w-5" />,
      href: '/admin/users'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <BarChart className="h-5 w-5" />,
      href: '/admin/analytics'
    }
  ]

  // University sections
  const universitySections: SidebarSection[] = [
    {
      id: 'university-dashboard',
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/university'
    },
    {
      id: 'university-students',
      title: 'Students',
      icon: <UserIcon className="h-5 w-5" />,
      items: [
        { href: '/university/students', icon: <UserIcon className="h-4 w-4" />, label: 'Student Overview' },
        { href: '/university/students/progress', icon: <BarChart className="h-4 w-4" />, label: 'Student Progress' },
        { href: '/university/students/licenses', icon: <ShieldCheck className="h-4 w-4" />, label: 'Add Student Licenses' },
      ]
    },
    {
      id: 'university-departments',
      title: 'Departments',
      icon: <Building className="h-5 w-5" />,
      href: '/university/departments'
    },
    {
      id: 'university-analytics',
      title: 'Usage Analytics',
      icon: <LineChart className="h-5 w-5" />,
      href: '/university/analytics'
    }
  ]

  // Combine sections based on user role
  // Admin roles should NOT see user-facing sections. University Admins should NOT see admin menu at all.
  const isUniAdmin = user?.role === 'university_admin'
  const filteredAdminSections: SidebarSection[] = adminSections.filter((sec) => {
    // University admins should not see any admin sections
    if (isUniAdmin) return false
    // Super admins see all admin sections
    return true
  })

  const allSections = isAdmin
    ? [
        ...(isUniversityUser ? universitySections : []),
        ...filteredAdminSections,
      ]
    : [
        ...sidebarSections,
        ...(isUniversityUser ? universitySections : []),
      ]

  // Determine active section by matching current pathname
  const getActiveSectionId = () => {
    for (const s of allSections) {
      if (s.href && isActive(s.href)) return s.id
      if (s.items) {
        for (const it of s.items) {
          if (isActive(it.href)) return s.id
        }
      }
    }
    return null
  }

  // On first load, default all sections with items to collapsed, but auto-expand the active one
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const initialized = localStorage.getItem('sidebarCollapsedInitialized')
      if (!initialized) {
        const next: Record<string, boolean> = {}
        for (const s of allSections) {
          if (s.items && s.items.length > 0) next[s.id] = true // collapsed by default
        }
        const activeId = getActiveSectionId()
        if (activeId) next[activeId] = false // expand active section
        setCollapsedSections(next)
        localStorage.setItem('sidebarCollapsedSections', JSON.stringify(next))
        localStorage.setItem('sidebarCollapsedInitialized', 'true')
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUniversityUser, isAdmin])

  // Always ensure the currently active section is expanded when route changes
  useEffect(() => {
    const activeId = getActiveSectionId()
    if (!activeId) return
    setCollapsedSections(prev => {
      if (prev && prev[activeId] === false) return prev
      const next = { ...prev, [activeId]: false }
      try { localStorage.setItem('sidebarCollapsedSections', JSON.stringify(next)) } catch {}
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

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

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderSidebarItem = (item: SidebarItem, exact?: boolean) => {
    const active = isActive(item.href, exact)
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
        onClick={disabled ? (e) => { e.preventDefault(); setShowUpsellModal(true) } : undefined}
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
    const isCollapsed = !!collapsedSections[section.id]

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

    // Section with items (collapsible)
    const toggleSectionItems = () => {
      setCollapsedSections(prev => {
        const next = { ...prev, [section.id]: !prev[section.id] }
        try { localStorage.setItem('sidebarCollapsedSections', JSON.stringify(next)) } catch {}
        return next
      })
    }

    return (
      <div key={section.id} className="space-y-1">
        <div
          className="flex items-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
          role="button"
          aria-expanded={!isCollapsed}
          onClick={toggleSectionItems}
        >
          <span className="mr-3">{section.icon}</span>
          {expanded && <span>{section.title}</span>}
          {expanded && (
            <ChevronRight
              className={`ml-auto h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
            />
          )}
        </div>
        <AnimatePresence initial={false}>
          {hasItems && !isCollapsed && (
            <motion.div
              key={`${section.id}-items`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              {section.items?.map((it) => renderSidebarItem(it, section.id === 'admin'))}
            </motion.div>
          )}
        </AnimatePresence>
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
              <h1 className="text-xl font-bold text-primary">Ascentful</h1>
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
                  href="/account#subscription"
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
          {/* Pro Upsell Modal */}
          <Dialog open={showUpsellModal} onOpenChange={setShowUpsellModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unlock Pro Features</DialogTitle>
                <DialogDescription>
                  This feature is available on the Pro plan. Upgrade to access LinkedIn Integration and other premium tools.
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm text-gray-600">
                • Save time with LinkedIn job search shortcuts and history
                <br />
                • Advanced career tools and automations
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Maybe later</Button>
                </DialogClose>
                <Link href="/account#subscription">
                  <Button onClick={() => setShowUpsellModal(false)}>Upgrade Now</Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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