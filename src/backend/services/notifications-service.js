import { supabase } from '../supabase';
export async function getUserNotifications(userId) {
    const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, body, timestamp, read')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
}
export async function markNotificationsRead(userId) {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    if (error) {
        console.error('Error marking notifications as read:', error);
    }
}
export async function markNotificationReadById(userId, notificationId) {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('id', notificationId);
    if (error) {
        console.error('Error marking notification as read:', error);
    }
}
export async function createNotification({ userId, title, body }) {
    const { error } = await supabase
        .from('notifications')
        .insert([
        {
            user_id: userId,
            title,
            body,
            timestamp: new Date().toISOString(),
            read: false
        }
    ]);
    if (error) {
        console.error('Error creating notification:', error);
    }
}
