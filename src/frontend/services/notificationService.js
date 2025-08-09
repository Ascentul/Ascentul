import { apiRequest } from "../utils/api";
/**
 * Fetch notifications for the current user
 */
export async function fetchNotifications() {
    const response = await apiRequest("GET", "/api/notifications");
    if (!response.ok)
        throw new Error("Failed to fetch notifications");
    const data = await response.json();
    // API returns { notifications: Notification[] }
    return data.notifications;
}
/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId) {
    const response = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
    if (!response.ok)
        throw new Error("Failed to mark notification as read");
}
/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead() {
    const response = await apiRequest("POST", "/api/notifications/read-all");
    if (!response.ok)
        throw new Error("Failed to mark all notifications as read");
}
