import { ReactNode, useEffect } from "react"
import { useLocation, Link } from "wouter"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useUser } from "@/lib/useUserData"
import {
  Loader2,
  LayoutGrid,
  Users,
  School,
  Settings,
  Mail,
  BarChart3,
  Shield,
  Database,
  Cpu,
  FileText,
  Star,
  CreditCard,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation()
  const { user, logout } = useUser()

  // Check if user is super admin for enhanced features
  const isSuperAdmin = user?.role === "super_admin"

  // Base navigation items available to all admins
  const baseNavItems = [
    {
      title: "Dashboard",
      icon: <LayoutGrid className="h-5 w-5" />,
      href: "/admin"
    },
    {
      title: "Universities",
      icon: <School className="h-5 w-5" />,
      href: "/admin/universities"
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users"
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/admin/analytics"
    },
    {
      title: "Reviews",
      icon: <Star className="h-5 w-5" />,
      href: "/admin/reviews"
    },
    {
      title: "Email",
      icon: <Mail className="h-5 w-5" />,
      href: "/admin/email"
    }
  ]

  // Enhanced navigation items only for super admins
  const superAdminNavItems = [
    {
      title: "System Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings"
    },
    {
      title: "AI Models",
      icon: <Cpu className="h-5 w-5" />,
      href: "/admin/models"
    },
    {
      title: "System Logs",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/openai-logs"
    },
    {
      title: "Billing Management",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/admin/billing"
    },
    {
      title: "System Security",
      icon: <Shield className="h-5 w-5" />,
      href: "/admin/system-security"
    }
  ]

  // Combine nav items based on role
  const navItems = isSuperAdmin
    ? [...baseNavItems, ...superAdminNavItems]
    : baseNavItems

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex h-full flex-col overflow-y-auto">
          {/* Logo & Header */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4 dark:border-gray-700">
            <Link href="/admin">
              <a className="flex items-center gap-2">
                <School className="h-6 w-6 text-blue-600" />
                <div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ascentul Admin
                  </span>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Shield className="h-3 w-3" />
                      <span>Super Admin</span>
                    </div>
                  )}
                </div>
              </a>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-1 p-4 flex-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  )}
                >
                  {item.icon}
                  {item.title}
                </a>
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="flex items-center mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImage || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {isSuperAdmin ? "Super Administrator" : "Administrator"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <div className="py-6">{children}</div>
      </main>
    </div>
  )
}
