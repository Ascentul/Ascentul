import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

// Define the notification interface since we may not have direct access to schema
interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string; // Using message instead of content
  type: string;
  read: boolean;
  link: string | null;
  createdAt: Date | string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  
  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications');
      const data = await res.json();
      return data;
    },
  });
  
  // Get unread count
  const { data: unreadCount } = useQuery<{count: number}>({
    queryKey: ['/api/notifications/unread/count'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications/unread/count');
      const data = await res.json();
      return data;
    },
    initialData: { count: 0 },
  });
  
  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest('POST', `/api/notifications/mark-read/${id}`);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest('POST', '/api/notifications/mark-all-read');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      setOpen(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Create test notification (development only)
  const createTestNotification = async () => {
    try {
      await apiRequest('POST', '/api/notifications/test');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  };
  
  // Automatically mark notification as read when popover is opened
  useEffect(() => {
    if (open && notifications.length > 0) {
      // No immediate auto-marking as read, user needs to explicitly mark them
    }
  }, [open, notifications]);
  
  // Format notification date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount.count > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {unreadCount.count > 9 ? '9+' : unreadCount.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between pb-2 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount.count > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80 mt-2">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-md ${notification.read ? 'bg-muted/30' : 'bg-muted/50'}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <h4 className="text-sm font-medium">{notification.title}</h4>
                  <p className="text-sm mt-1">{notification.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt.toString())}
                    </span>
                    {!notification.read && (
                      <Badge variant="outline" className="text-xs">New</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="pt-2 mt-2 border-t">
            <Button variant="outline" size="sm" onClick={createTestNotification} className="w-full">
              Create Test Notification
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}