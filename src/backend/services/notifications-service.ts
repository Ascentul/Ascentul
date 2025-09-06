import { supabase } from '../supabase';

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export type NotificationCategory =
  | 'system'
  | 'account'
  | 'application'
  | 'goal'
  | 'resume'
  | 'cover_letter'
  | 'career_path'
  | 'network'
  | 'project'
  | 'recommendation'

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'slack'
export type NotificationCadence = 'immediate' | 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface NotificationMeta {
  text?: string
  category?: NotificationCategory
  channel?: NotificationChannel
  cadence?: NotificationCadence
  ctaText?: string
  ctaUrl?: string
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, timestamp, read')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return (data as Notification[]) || [];
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) {
    console.error('Error marking notifications as read:', error);
  }
}

export async function markNotificationReadById(userId: string, notificationId: number): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('id', notificationId);
  if (error) {
    console.error('Error marking notification as read:', error);
  }
}

export async function createNotification(
  params:
    | { userId: string; title: string; body: string }
    | { userId: string; title: string; meta: NotificationMeta }
): Promise<void> {
  const { userId, title } = params as any
  const body = 'meta' in params
    ? JSON.stringify({ text: params.meta.text, ...params.meta })
    : (params as any).body

  const { error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title,
        body,
        timestamp: new Date().toISOString(),
        read: false,
      },
    ])
  if (error) {
    console.error('Error creating notification:', error)
  }
}
