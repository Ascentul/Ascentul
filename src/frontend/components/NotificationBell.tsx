import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import { useEffect, useRef } from 'react';

export function NotificationBell() {
  const { notifications, isLoading, markNotificationRead } = useNotifications();
  const { toast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Track previous notification IDs to detect new ones
  const prevNotifIdsRef = useRef<string[]>([]);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Show toast for new daily recommendation notifications
  useEffect(() => {
    const prevIds = prevNotifIdsRef.current;
    const currentIds = notifications.map(n => n.id);
    // Find newly arrived notifications
    const newNotifs = notifications.filter(
      n => !prevIds.includes(n.id) && !n.read &&
        (
          n.title.toLowerCase().includes('recommendation') ||
          n.body.toLowerCase().includes('recommendation')
        )
    );
    if (newNotifs.length > 0) {
      // Show a toast for each new daily recommendation notification
      newNotifs.forEach(n => {
        toast({
          title: n.title,
          description: n.body,
          variant: 'default',
        });
      });
    }
    prevNotifIdsRef.current = currentIds;
  }, [notifications, toast]);

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
          <div className="p-3 border-b font-semibold text-sm">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer ${n.read ? 'bg-white' : 'bg-blue-50'}`}
                  onClick={() => {
                    if (!n.read) markNotificationRead(n.id);
                    setDropdownOpen(false);
                  }}
                >
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.body}</div>
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
