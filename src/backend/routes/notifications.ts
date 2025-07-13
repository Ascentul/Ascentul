import { Router } from 'express';
import { verifySupabaseToken } from '../supabase-auth';
import { getUserNotifications, markNotificationsRead, markNotificationReadById } from '../services/notifications-service';

const router = Router();

// GET /api/notifications - Get all notifications for the logged-in user
router.get('/', verifySupabaseToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const notifications = await getUserNotifications(userId);
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/:id/read - Mark a single notification as read for the logged-in user
router.post('/:id/read', verifySupabaseToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await markNotificationReadById(userId, parseInt(id, 10));
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read for the logged-in user
router.post('/read-all', verifySupabaseToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    await markNotificationsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// POST /api/notifications/mark-read - Mark all notifications as read for the logged-in user
router.post('/mark-read', verifySupabaseToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    await markNotificationsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

export default router;
