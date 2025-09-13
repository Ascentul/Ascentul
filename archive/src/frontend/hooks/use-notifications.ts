import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  Notification,
} from '@/services/notificationService';

/**
 * Hook to fetch and manage user notifications
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: fetchNotifications,
    staleTime: 60 * 1000, // 1 minute
  });

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/notifications']);
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/notifications']);
    },
  });

  return {
    notifications,
    isLoading,
    error,
    refetch,
    markNotificationRead: markReadMutation.mutate,
    markAllNotificationsRead: markAllReadMutation.mutate,
    markNotificationReadAsync: markReadMutation.mutateAsync,
    markAllNotificationsReadAsync: markAllReadMutation.mutateAsync,
  };
}
