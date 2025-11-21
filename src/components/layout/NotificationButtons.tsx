"use client";

import { Bell, MessageCircle } from "lucide-react";

function IconButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { hasUnread?: boolean }
) {
  const { hasUnread, children, className = "", ...rest } = props;

  return (
    <button
      type="button"
      {...rest}
      className={[
        "relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700",
        className,
      ].join(" ")}
    >
      {children}
      {hasUnread && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      )}
    </button>
  );
}

export function NotificationButtons() {
  return (
    <div className="flex items-center gap-2">
      <IconButton aria-label="Messages" hasUnread>
        <MessageCircle className="h-4 w-4" />
      </IconButton>
      <IconButton aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
