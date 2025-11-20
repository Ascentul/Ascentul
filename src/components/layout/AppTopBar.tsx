"use client";

import { usePathname } from "next/navigation";
import { Bell, MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  hasUnread?: boolean;
};

function IconButton({ hasUnread, className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full",
        "border border-slate-200 bg-white text-slate-500",
        "hover:bg-slate-50 hover:text-slate-700 transition-colors",
        className
      )}
    >
      {children}
      {hasUnread && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      )}
    </button>
  );
}

export default function AppTopBar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-20 bg-[#F1F3F9]/70 backdrop-blur">
      <div className="flex w-full items-center justify-end px-4 py-3.5 md:px-6">
        <div className="flex items-center gap-2.5 pr-5">
          <IconButton aria-label="Search">
            <Search className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label="Messages" hasUnread>
            <MessageCircle className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
