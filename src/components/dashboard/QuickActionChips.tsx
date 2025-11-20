"use client";

import Link from "next/link";
import { Plus, Target, FileText, Briefcase, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChipProps {
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

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
  return (
    <div className="flex items-center justify-between">
      {/* Pills - desktop and up */}
      <div className="hidden md:flex flex-wrap items-center gap-2.5">
        <Chip href="/applications" icon={Briefcase}>Add application</Chip>
        <Chip href="/applications?action=interview" icon={Calendar}>Log interview</Chip>
        <Chip href="/goals" icon={Target}>Create goal</Chip>
        <Chip href="/resumes" icon={FileText}>Update resume</Chip>
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
            <Link href="/goals" className="w-full">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm transition-colors hover:bg-slate-50">
                <div className="mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50">
                  <Target className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <div className="font-medium">Create a Goal</div>
                  <div className="text-xs text-muted-foreground">Track your career objectives</div>
                </div>
              </div>
            </Link>

            <Link href="/resumes" className="w-full">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm transition-colors hover:bg-slate-50">
                <div className="mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50">
                  <FileText className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <div className="font-medium">Update Resume</div>
                  <div className="text-xs text-muted-foreground">Build a professional resume</div>
                </div>
              </div>
            </Link>

            <Link href="/applications" className="w-full">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm transition-colors hover:bg-slate-50">
                <div className="mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <Briefcase className="h-5 w-5 text-[#16A34A]" />
                </div>
                <div>
                  <div className="font-medium">Add Application</div>
                  <div className="text-xs text-muted-foreground">Track your job applications</div>
                </div>
              </div>
            </Link>

            <Link href="/applications?action=interview" className="w-full">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm transition-colors hover:bg-slate-50">
                <div className="mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Log Interview</div>
                  <div className="text-xs text-muted-foreground">Record interview details</div>
                </div>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
