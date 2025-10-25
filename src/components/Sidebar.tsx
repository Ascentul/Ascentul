"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  Zap,
} from "lucide-react";

// Sidebar section types
type SidebarSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items?: SidebarItem[];
  href?: string;
  onClick?: () => void;
  pro?: boolean;
};

type SidebarItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  pro?: boolean;
};

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar = React.memo(function Sidebar({
  isOpen,
  onToggle,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { user, signOut, isAdmin, subscription, hasPremium } = useAuth();

  // Check if user is on free plan and not a university admin or premium user
  const isFreeUser = useMemo(
    () =>
      !hasPremium &&
      user?.role !== "university_admin" &&
      !isAdmin,
    [hasPremium, user?.role, isAdmin],
  );

  const isUniversityUser = useMemo(
    () =>
      user?.role === "university_admin" ||
      subscription.isUniversity,
    [user?.role, subscription.isUniversity],
  );

  // Fetch usage data ONLY for free users (optimization: skip query for premium/university users)
  const usageData = useQuery(
    api.usage.getUserUsage,
    user?.clerkId && isFreeUser ? { clerkId: user.clerkId } : "skip"
  );

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hoverSection, setHoverSection] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(
    typeof window !== "undefined"
      ? localStorage.getItem("sidebarExpanded") !== "false"
      : true,
  );
  const [menuPositions, setMenuPositions] = useState<Record<string, number>>(
    {},
  );
  // Persisted collapsed state per section id
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sidebarCollapsedSections");
        return saved ? JSON.parse(saved) : {};
      } catch {}
    }
    return {};
  });

  // Support ticket related state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("Other");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Upsell modal for Pro-only features
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  // Memoize sidebar sections - Grouped navigation structure
  const sidebarSections: SidebarSection[] = useMemo(
    () => [
      {
        id: "dashboard",
        title: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        href: "/dashboard",
      },
      {
        id: "applications",
        title: "Applications",
        icon: <ClipboardList className="h-5 w-5" />,
        href: "/applications",
      },
      {
        id: "my-path",
        title: "My Path",
        icon: <Target className="h-5 w-5" />,
        items: [
          {
            href: "/goals",
            icon: <Target className="h-4 w-4" />,
            label: "Goals",
          },
          {
            href: "/career-path",
            icon: <GitBranch className="h-4 w-4" />,
            label: "Career Path Explorer",
          },
        ],
      },
      {
        id: "portfolio",
        title: "Portfolio",
        icon: <FolderGit2 className="h-5 w-5" />,
        items: [
          {
            href: "/resumes",
            icon: <FileText className="h-4 w-4" />,
            label: "Resume Studio",
          },
          {
            href: "/cover-letters",
            icon: <Mail className="h-4 w-4" />,
            label: "Cover Letter Coach",
          },
          {
            href: "/projects",
            icon: <FolderGit2 className="h-4 w-4" />,
            label: "Projects",
          },
        ],
      },
      {
        id: "connections",
        title: "Connections",
        icon: <UserRound className="h-5 w-5" />,
        items: [
          {
            href: "/contacts",
            icon: <UserRound className="h-4 w-4" />,
            label: "Network Hub",
          },
        ],
      },
      {
        id: "career-coach",
        title: "Career Coach",
        icon: <Bot className="h-5 w-5" />,
        href: "/career-coach",
        pro: true,
      },
      {
        id: "career-profile",
        title: "Career Profile",
        icon: <UserIcon className="h-5 w-5" />,
        href: "/profile",
      },
    ],
    [],
  );

  // Admin sections (top-level for super admins) - flattened for direct access
  const adminSections: SidebarSection[] = useMemo(
    () => [
      {
        id: "admin-dashboard",
        title: "Admin Dashboard",
        icon: <ShieldCheck className="h-5 w-5" />,
        href: "/admin",
      },
      {
        id: "admin-users",
        title: "User Management",
        icon: <UserIcon className="h-5 w-5" />,
        href: "/admin/users",
      },
      {
        id: "admin-universities",
        title: "Universities",
        icon: <School className="h-5 w-5" />,
        href: "/admin/universities",
      },
      {
        id: "admin-analytics",
        title: "Analytics",
        icon: <BarChart className="h-5 w-5" />,
        href: "/admin/analytics",
      },
      {
        id: "admin-support",
        title: "Support Tickets",
        icon: <HelpCircle className="h-5 w-5" />,
        href: "/admin/support",
      },
      {
        id: "admin-settings",
        title: "Settings",
        icon: <Settings className="h-5 w-5" />,
        href: "/admin/settings",
      },
    ],
    [],
  );

  // University sections - streamlined for University Admins
  const universitySections: SidebarSection[] = useMemo(
    () => [
      {
        id: "university-dashboard",
        title: "Dashboard",
        icon: <School className="h-5 w-5" />,
        href: "/university",
      },
      {
        id: "university-students",
        title: "Students",
        icon: <UserIcon className="h-5 w-5" />,
        href: "/university/students",
      },
      {
        id: "university-departments",
        title: "Departments",
        icon: <Building className="h-5 w-5" />,
        href: "/university/departments",
      },
      {
        id: "university-analytics",
        title: "Analytics",
        icon: <BarChart className="h-5 w-5" />,
        href: "/university/analytics",
      },
      {
        id: "university-support",
        title: "Support",
        icon: <HelpCircle className="h-5 w-5" />,
        href: "/support",
      },
    ],
    [],
  );

  // Combine sections based on user role - memoized
  const isUniAdmin = useMemo(
    () => user?.role === "university_admin",
    [user?.role],
  );

  // Determine which sections to show based on user role - memoized
  const allSections: SidebarSection[] = useMemo(() => {
    if (isUniAdmin) {
      return universitySections;
    } else if (isAdmin) {
      return adminSections;
    } else {
      return sidebarSections;
    }
  }, [isUniAdmin, isAdmin, universitySections, adminSections, sidebarSections]);

  // Memoize isActive function
  const isActive = useCallback(
    (href: string, exact?: boolean) => {
      if (exact) return pathname === href;
      // For non-exact matches, use prefix matching to handle nested routes
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname],
  );

  // Determine active section by matching current pathname - memoized
  const getActiveSectionId = useCallback(() => {
    for (const s of allSections) {
      if (s.href && isActive(s.href)) return s.id;
      if (s.items) {
        for (const it of s.items) {
          // Use exact matching for admin dashboard items to avoid conflicts
          const shouldUseExact =
            s.id === "admin-dashboard" && it.href === "/admin";
          if (isActive(it.href, shouldUseExact)) return s.id;
        }
      }
    }
    return null;
  }, [allSections, isActive]);

  // On first load, default all sections with items to collapsed, but auto-expand the active one
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const initialized = localStorage.getItem("sidebarCollapsedInitialized");
      if (!initialized) {
        const next: Record<string, boolean> = {};
        for (const s of allSections) {
          if (s.items && s.items.length > 0) next[s.id] = true; // collapsed by default
        }
        const activeId = getActiveSectionId();
        if (activeId) next[activeId] = false; // expand active section
        setCollapsedSections(next);
        localStorage.setItem("sidebarCollapsedSections", JSON.stringify(next));
        localStorage.setItem("sidebarCollapsedInitialized", "true");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Always ensure the currently active section is expanded when route changes
  useEffect(() => {
    const activeId = getActiveSectionId();
    if (!activeId) return;
    setCollapsedSections((prev) => {
      if (prev && prev[activeId] === false) return prev;
      const next = { ...prev, [activeId]: false };
      try {
        localStorage.setItem("sidebarCollapsedSections", JSON.stringify(next));
      } catch {}
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [signOut, router]);

  const handleSupportSubmit = useCallback(async () => {
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          description,
          issueType,
          source: "sidebar",
        }),
      });

      if (response.ok) {
        setShowSupportModal(false);
        setSubject("");
        setDescription("");
        setIssueType("Other");
      }
    } catch (error) {
      console.error("Error submitting support ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [subject, description, issueType]);

  const toggleExpanded = useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarExpanded", newExpanded.toString());
    }
  }, [expanded]);

  const renderSidebarItem = useCallback(
    (item: SidebarItem, sectionId?: string, forceExact?: boolean) => {
      // Use exact matching for the main admin dashboard item to avoid highlighting conflicts
      // when on sub-pages like /admin/analytics - only highlight the specific item, not the parent
      const shouldUseExact =
        forceExact ||
        (sectionId === "admin-dashboard" && item.href === "/admin");
      const active = isActive(item.href, shouldUseExact);
      const disabled = item.pro && isFreeUser;

      return (
        <Link
          key={item.href}
          href={disabled ? "#" : item.href}
          className={`
          flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 relative
          ${
            active
              ? "bg-[#f0f2ff] text-[#616ef6]"
              : disabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }
        `}
          onClick={
            disabled
              ? (e) => {
                  e.preventDefault();
                  setShowUpsellModal(true);
                }
              : undefined
          }
        >
          <span className={`${expanded ? "mr-3" : ""} flex-shrink-0`}>
            {item.icon}
          </span>
          {expanded && (
            <>
              <span className="flex-1">{item.label}</span>
              {item.pro && isFreeUser && (
                <Zap className="h-3 w-3 text-yellow-500" />
              )}
            </>
          )}
        </Link>
      );
    },
    [isActive, isFreeUser, expanded],
  );

  const renderSection = useCallback(
    (section: SidebarSection) => {
      const hasItems = section.items && section.items.length > 0;
      // Use exact matching for sections with href to avoid highlighting parent when on child routes
      const sectionActive = section.href ? isActive(section.href, true) : false;
      const isCollapsed = !!collapsedSections[section.id];

      // Check if any child items are active (but not the first item in admin sections to avoid double-highlighting)
      const hasActiveItem =
        hasItems &&
        section.items?.some((item) => {
          const shouldUseExact =
            section.id === "admin-dashboard" && item.href === "/admin";
          return isActive(item.href, shouldUseExact);
        });

      // Check if this is a pro feature
      const isPro = "pro" in section && section.pro;
      const disabled = isPro && isFreeUser;

      if (!hasItems && section.onClick) {
        // Single item section with onClick handler (e.g., Support)
        return (
          <button
            key={section.id}
            onClick={section.onClick}
            className={`
            w-full flex items-center px-3 py-2 mx-2 text-sm rounded-lg transition-colors
            ${
              disabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }
          `}
          >
            <span className="mr-3">{section.icon}</span>
            {expanded && (
              <>
                <span className="flex-1">{section.title}</span>
                {isPro && isFreeUser && (
                  <Zap className="h-3 w-3 text-yellow-500" />
                )}
              </>
            )}
          </button>
        );
      }

      if (!hasItems && section.href) {
        // Single item section - new flat structure
        return (
          <Link
            key={section.id}
            href={disabled ? "#" : section.href}
            className={`
            flex items-center px-3 py-2 mx-2 text-sm rounded-lg transition-colors
            ${
              sectionActive || hasActiveItem
                ? "bg-[#f0f2ff] text-[#616ef6]"
                : disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }
          `}
            onClick={
              disabled
                ? (e) => {
                    e.preventDefault();
                    setShowUpsellModal(true);
                  }
                : undefined
            }
          >
            <span className="mr-3">{section.icon}</span>
            {expanded && (
              <>
                <span className="flex-1">{section.title}</span>
                {isPro && isFreeUser && (
                  <Zap className="h-3 w-3 text-yellow-500" />
                )}
              </>
            )}
          </Link>
        );
      }

      // Section with items (collapsible)
      const toggleSectionItems = () => {
        setCollapsedSections((prev) => {
          const next = { ...prev, [section.id]: !prev[section.id] };
          try {
            localStorage.setItem(
              "sidebarCollapsedSections",
              JSON.stringify(next),
            );
          } catch {}
          return next;
        });
      };

      return (
        <div key={section.id} className="space-y-1">
          <div
            className="flex items-center px-3 py-2 mx-2 text-sm rounded-lg cursor-pointer select-none transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            role="button"
            aria-expanded={!isCollapsed}
            onClick={toggleSectionItems}
          >
            <span className="mr-3 flex-shrink-0">{section.icon}</span>
            {expanded && <span className="flex-1">{section.title}</span>}
            {expanded && (
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
              />
            )}
          </div>
          <AnimatePresence initial={false}>
            {hasItems && !isCollapsed && (
              <motion.div
                key={`${section.id}-items`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
                className="ml-2 space-y-1"
              >
                {section.items?.map((it) => renderSidebarItem(it, section.id))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    [isActive, collapsedSections, expanded, isFreeUser, renderSidebarItem],
  );

  return (
    <>
      <div
        ref={sidebarRef}
        className={`
          bg-white shadow-lg transition-all duration-300 ease-in-out z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${expanded ? "w-64" : "w-20"}
          md:translate-x-0 md:static md:inset-0
          fixed inset-y-0 left-0 flex flex-col
        `}
      >
        {/* Header */}
        <div
          className={`flex items-center ${expanded ? "justify-between" : "justify-center"} p-4 border-b`}
        >
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
            {expanded ? (
              <ChevronsLeft className="h-4 w-4" />
            ) : (
              <PanelRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Profile */}
        {clerkUser && (
          <div className="p-4 border-b">
            <div
              className={`flex items-center ${expanded ? "space-x-3" : "justify-center"}`}
            >
              <Link href="/profile" className="flex-shrink-0 cursor-pointer">
                <img
                  src={
                    user?.profile_image ||
                    clerkUser.imageUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(clerkUser.firstName || user?.name || "User")}&background=0C29AB&color=fff`
                  }
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover hover:ring-2 hover:ring-primary transition-all"
                />
              </Link>
              {expanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {clerkUser.firstName ||
                      clerkUser.emailAddresses[0]?.emailAddress?.split(
                        "@",
                      )[0] ||
                      "User"}
                  </p>
                  {!isAdmin && (
                    <p className="text-xs text-gray-500 truncate">
                      {subscription.planName}
                    </p>
                  )}
                </div>
              )}
            </div>
            {expanded && isFreeUser && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Free Plan</span>
                  {usageData ? (
                    <span>{usageData.stepsCompleted}/{usageData.totalSteps} steps</span>
                  ) : (
                    <span>Loading...</span>
                  )}
                </div>
                <Progress
                  value={usageData ? (usageData.stepsCompleted / usageData.totalSteps) * 100 : 0}
                  className="h-2"
                />
                <Link
                  href="/pricing"
                  className="text-xs text-primary hover:underline mt-1 block cursor-pointer"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
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
                  This feature is available on the Pro plan. Upgrade to access
                  LinkedIn Integration and other premium tools.
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm text-gray-600">
                • Save time with LinkedIn job search shortcuts and history
                <br />• Advanced career tools and automations
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Maybe later</Button>
                </DialogClose>
                <Button
                  onClick={async () => {
                    setShowUpsellModal(false);
                    try {
                      const response = await fetch("/api/stripe/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          plan: "premium",
                          interval: "monthly",
                        }),
                      });
                      const data = await response.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      console.error("Checkout error:", error);
                    }
                  }}
                >
                  Upgrade Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Settings Button */}
          {isUniAdmin ? (
            <Link href="/university/settings">
              <Button
                variant="ghost"
                className={`w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors ${expanded ? "justify-start" : "justify-center"}`}
              >
                <Settings className="h-4 w-4" />
                {expanded && <span className="ml-3">Settings</span>}
              </Button>
            </Link>
          ) : !isAdmin && (
            <Link href="/account">
              <Button
                variant="ghost"
                className={`w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors ${expanded ? "justify-start" : "justify-center"}`}
              >
                <Settings className="h-4 w-4" />
                {expanded && <span className="ml-3">Account Settings</span>}
              </Button>
            </Link>
          )}

          {/* Support Button for non-admin users only */}
          {!isAdmin && (
            <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors ${expanded ? "justify-start" : "justify-center"}`}
                >
                  <HelpCircle className="h-4 w-4" />
                  {expanded && <span className="ml-3">Support</span>}
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
                    disabled={
                      isSubmitting || !subject.trim() || !description.trim()
                    }
                  >
                    {isSubmitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors ${expanded ? "justify-start" : "justify-center"}`}
          >
            <LogOut className="h-4 w-4" />
            {expanded && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  );
});

export default Sidebar;
