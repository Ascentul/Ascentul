import { ReactNode, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, LayoutGrid, Users, School, Settings, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

// Navigation items for the admin dashboard
const navItems = [
  {
    title: "Dashboard",
    icon: <LayoutGrid className="h-5 w-5" />,
    href: "/admin",
  },
  {
    title: "Universities",
    icon: <School className="h-5 w-5" />,
    href: "/admin/universities",
  },
  {
    title: "Users",
    icon: <Users className="h-5 w-5" />,
    href: "/admin/users",
  },
  {
    title: "Email",
    icon: <Mail className="h-5 w-5" />,
    href: "/admin/email",
  },
  {
    title: "Settings",
    icon: <Settings className="h-5 w-5" />,
    href: "/admin/settings",
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();

  // Query to check if user is admin
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user");
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      return response.json();
    },
    retry: false,
  });

  // Redirect non-admin users - check both role and userType fields
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'super_admin' && user.role !== 'admin' && user.userType !== "admin"))) {
      console.log("AdminLayout: Access denied. User role:", user?.role, "User type:", user?.userType);
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If authentication check passed, render the layout
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
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ascentul Admin
                </span>
              </a>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  )}
                  onClick={(e) => {
                    // Special handling for Universities page
                    if (item.href === "/admin/universities") {
                      e.preventDefault();
                      console.log("Navigation to Universities page requested");
                      // Use direct window navigation for Universities page
                      window.location.href = item.href;
                    }
                  }}
                >
                  {item.icon}
                  {item.title}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <div className="py-6">{children}</div>
      </main>
    </div>
  );
}