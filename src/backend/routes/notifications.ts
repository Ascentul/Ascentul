import { Router } from 'express';
import { verifySupabaseToken } from '../supabase-auth';
import { getUserNotifications, markNotificationsRead } from '../services/notifications-service';

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
