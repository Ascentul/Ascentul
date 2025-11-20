"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

interface ChipProps {
  href: string;
  children: React.ReactNode;
}

function Chip({ href, children }: ChipProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
    >
      <Plus className="h-3 w-3 text-slate-400" />
      {children}
    </Link>
  );
}

export function QuickActionChips() {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Chip href="/applications">Add application</Chip>
      <Chip href="/applications?action=interview">Log interview</Chip>
      <Chip href="/goals">Create goal</Chip>
      <Chip href="/resumes">Update resume</Chip>
    </div>
  );
}
