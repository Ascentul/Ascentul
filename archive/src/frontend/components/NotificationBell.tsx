import { Bell, Briefcase, Target, FileText, Mail, GitBranch, UserRound, FolderGit2, Zap, Sparkles, Info } from 'lucide-react';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Notification as AppNotification, NotificationMeta } from '@/services/notificationService';

function parseMeta(body: string): NotificationMeta | null {
  try {
    const parsed = JSON.parse(body);
    // If it's a plain object with optional text, accept it as meta
    if (parsed && typeof parsed === 'object') return parsed as NotificationMeta;
    return null;
  } catch {
    return null;
  }
}

function categoryIcon(category?: NotificationMeta['category']) {
  switch (category) {
    case 'application':
      return <Briefcase className="h-4 w-4 text-primary" />;
    case 'goal':
      return <Target className="h-4 w-4 text-primary" />;
    case 'resume':
      return <FileText className="h-4 w-4 text-primary" />;
    case 'cover_letter':
      return <Mail className="h-4 w-4 text-primary" />;
    case 'career_path':
      return <GitBranch className="h-4 w-4 text-primary" />;
    case 'network':
      return <UserRound className="h-4 w-4 text-primary" />;
    case 'project':
      return <FolderGit2 className="h-4 w-4 text-primary" />;
    case 'recommendation':
      return <Sparkles className="h-4 w-4 text-primary" />;
    case 'system':
    case 'account':
      return <Info className="h-4 w-4 text-primary" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
}

export function NotificationBell() {
  const { notifications, isLoading, markNotificationRead, markAllNotificationsRead } = useNotifications();
  const { toast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Track previous notification IDs to detect new ones
  const prevNotifIdsRef = useRef<string[]>([]);

  // Enrich notifications with parsed metadata
  const enriched = useMemo(() => {
    return notifications.map((n: AppNotification) => {
      const meta = parseMeta(n.body);
      const text = meta?.text || n.body;
      return { ...n, meta, displayText: text } as AppNotification & { meta: NotificationMeta | null; displayText: string };
    });
  }, [notifications]);

  // Count unread notifications
  const unreadCount = enriched.filter(n => !n.read).length;

  // Show toast for new daily recommendation notifications
  useEffect(() => {
    const prevIds = prevNotifIdsRef.current;
    const currentIds = enriched.map(n => n.id);
    // Find newly arrived notifications
    const newNotifs = enriched.filter(
      n => !prevIds.includes(n.id) && !n.read &&
        (n.meta?.category === 'recommendation' ||
         n.title.toLowerCase().includes('recommendation') ||
         n.displayText.toLowerCase().includes('recommendation'))
    );
    if (newNotifs.length > 0) {
      // Show a toast for each new daily recommendation notification
      newNotifs.forEach(n => {
        toast({
          title: n.title,
          description: n.displayText,
          variant: 'default',
        });
      });
    }
    prevNotifIdsRef.current = currentIds;
  }, [enriched, toast]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-neutral-700 hover:text-primary"
        aria-label="Notifications"
        onClick={() => setDropdownOpen(open => !open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
            {unreadCount}
          </span>
        )}
      </Button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-50 border">
          <div className="p-3 border-b font-semibold text-sm flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => markAllNotificationsRead()}
                aria-label="Mark all as read"
              >
                <Zap className="h-4 w-4 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : enriched.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications</div>
            ) : (
              enriched.map(n => (
                <div
                  key={n.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer ${n.read ? 'bg-white' : 'bg-blue-50'}`}
                  onClick={() => {
                    if (!n.read) markNotificationRead(n.id);
                    setDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {categoryIcon(n.meta?.category)}
                    <div className="font-medium text-sm">{n.title}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.displayText}</div>
                  {n.meta?.ctaText && n.meta?.ctaUrl && (
                    <a
                      href={n.meta.ctaUrl}
                      className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {n.meta.ctaText}
                    </a>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
