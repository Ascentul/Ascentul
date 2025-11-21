"use client";

import Link from "next/link";
import {
  Plus,
  FileText,
  Briefcase,
  Compass,
  MessageCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/ClerkAuthProvider";

type QuickActionsUser = {
  role?: string | null;
  university_id?: string | null;
  universityId?: string | null; // Alternative property name used in some contexts
  advisor_id?: string | null;
  advisorId?: string | null;
  primaryAdvisorId?: string | null;
};

type QuickActionId =
  | "trackApplication"
  | "explorePaths"
  | "updateResume"
  | "askAdvisor"
  | "askCareerCoach";

interface QuickActionConfig {
  id: QuickActionId;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  visible?: boolean;
}

interface ChipProps {
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export const canShowAdvisorPill = (
  user: QuickActionsUser | null | undefined,
): boolean => {
  if (!user) return false;

  const isStudentLike =
    user.role === "student" || user.role === "user" || user.role === "individual";
  if (!isStudentLike) return false;

  const universityId = user.university_id || user.universityId;
  const hasUniversity = Boolean(universityId);
  const advisorId =
    user.advisor_id || user.advisorId || user.primaryAdvisorId;
  const hasAdvisor = Boolean(advisorId);

  return hasUniversity && hasAdvisor;
};

const canShowCareerCoachPill = (
  user: QuickActionsUser | null | undefined,
): boolean => {
  if (!user) return false;

  const isStudentLike =
    user.role === "student" || user.role === "user" || user.role === "individual";
  if (!isStudentLike) return false;

  const universityId = user.university_id || user.universityId;
  const hasUniversity = Boolean(universityId);

  return !hasUniversity;
};

function Chip({ href, icon: Icon, children }: ChipProps) {
  const IconComponent = Icon || Plus;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5271FF]/40 focus-visible:ring-offset-2"
    >
      <IconComponent className="h-4 w-4 text-slate-500" />
      {children}
    </Link>
  );
}

export function QuickActionChips() {
  const { user } = useAuth();

  const actions: QuickActionConfig[] = [
    {
      id: "trackApplication",
      label: "Track application",
      href: "/applications",
      icon: Briefcase,
      description: "Track your job applications",
      iconBgClass: "bg-emerald-50",
      iconColorClass: "text-green-600",
      visible: true,
    },
    {
      id: "explorePaths",
      label: "Explore career paths",
      href: "/career-path",
      icon: Compass,
      description: "Discover tailored career directions",
      iconBgClass: "bg-indigo-50",
      iconColorClass: "text-indigo-500",
      visible: true,
    },
    {
      id: "updateResume",
      label: "Update resume",
      href: "/resumes",
      icon: FileText,
      description: "Build or refresh your resume",
      iconBgClass: "bg-primary-50",
      iconColorClass: "text-primary-500",
      visible: true,
    },
    {
      id: "askAdvisor",
      label: "Ask advisor",
      href: "/support",
      icon: MessageCircle,
      description: "Connect with your advisor",
      iconBgClass: "bg-blue-50",
      iconColorClass: "text-blue-500",
      visible: canShowAdvisorPill(user),
    },
    {
      id: "askCareerCoach",
      label: "Ask Career Coach",
      href: "/career-coach",
      icon: MessageCircle,
      description: "Chat with your career coach",
      iconBgClass: "bg-blue-50",
      iconColorClass: "text-blue-500",
      visible: canShowCareerCoachPill(user),
    },
  ];

  const visibleActions = actions.filter((action) => action.visible !== false);

  return (
    <div className="flex items-center justify-between">
      {/* Pills - desktop and up */}
      <div className="hidden md:flex flex-wrap items-center gap-2.5">
        {visibleActions.map((action) => (
          <Chip key={action.id} href={action.href} icon={action.icon}>
            {action.label}
          </Chip>
        ))}
      </div>

      {/* Quick actions button - mobile only */}
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-slate-700 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5271FF]/40 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4 text-slate-500" />
            Quick actions
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Quick Actions</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 py-4">
            {visibleActions.map((action) => (
              <Link key={action.id} href={action.href} className="w-full">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm transition-colors hover:bg-slate-50">
                  <div
                    className={`mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${action.iconBgClass || "bg-primary-50"}`}
                  >
                    <action.icon
                      className={`h-5 w-5 ${action.iconColorClass || "text-primary-500"}`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{action.label}</div>
                    {action.description ? (
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
