// Use the shared apiRequest helper so Supabase token is included
import { apiRequest } from "@/lib/queryClient";

export interface NotificationMeta {
  text?: string;
  category?:
    | "system"
    | "account"
    | "application"
    | "goal"
    | "resume"
    | "cover_letter"
    | "career_path"
    | "network"
    | "project"
    | "recommendation";
  channel?: "in_app" | "email" | "push" | "slack";
  cadence?: "immediate" | "daily" | "weekly" | "monthly" | "quarterly";
  ctaText?: string;
  ctaUrl?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string; // may be plain text or JSON stringified NotificationMeta with `text`
  timestamp: string;
  read: boolean;
}

/**
 * Fetch notifications for the current user
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const res = await apiRequest("GET", "/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  const data = await res.json();
  return (data.notifications as Notification[]) || [];
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const response = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
  if (!response.ok) throw new Error("Failed to mark notification as read");
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  const response = await apiRequest("POST", "/api/notifications/read-all");
  if (!response.ok) throw new Error("Failed to mark all notifications as read");
}
