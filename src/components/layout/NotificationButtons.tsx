'use client';

import { Bell, MessageCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

function IconButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { hasUnread?: boolean },
) {
  const { hasUnread, children, className = '', ...rest } = props;

  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors',
        className,
      )}
    >
      {children}
      {hasUnread && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </button>
  );
}

export interface NotificationButtonsProps {
  /** Whether there are unread messages */
  hasUnreadMessages?: boolean;
  /** Whether there are unread notifications */
  hasUnreadNotifications?: boolean;
  /** Click handler for messages button */
  onMessagesClick?: () => void;
  /** Click handler for notifications button */
  onNotificationsClick?: () => void;
}

/**
 * NotificationButtons component
 *
 * Displays message and notification buttons with optional unread indicators.
 * Connect to your state management solution (React Context, Zustand, etc.)
 * to provide dynamic unread counts and click handlers.
 *
 * @example
 * ```tsx
 * <NotificationButtons
 *   hasUnreadMessages={unreadCount > 0}
 *   hasUnreadNotifications={notificationCount > 0}
 *   onMessagesClick={() => router.push('/messages')}
 *   onNotificationsClick={() => setNotificationsOpen(true)}
 * />
 * ```
 */
export function NotificationButtons({
  hasUnreadMessages = false,
  hasUnreadNotifications = false,
  onMessagesClick,
  onNotificationsClick,
}: NotificationButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <IconButton aria-label="Messages" hasUnread={hasUnreadMessages} onClick={onMessagesClick}>
        <MessageCircle className="h-4 w-4" />
      </IconButton>
      <IconButton
        aria-label="Notifications"
        hasUnread={hasUnreadNotifications}
        onClick={onNotificationsClick}
      >
        <Bell className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
