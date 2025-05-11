import express from 'express';
import { storage } from '../storage';
import { requireAuth } from '../auth';
import { insertNotificationSchema } from '@shared/schema';
import { z } from 'zod';

// Create a router for notifications endpoints
const notificationsRouter = express.Router();

// GET /api/notifications - Get user's notifications
notificationsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const notifications = await storage.getNotifications(userId);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread/count - Get count of unread notifications
notificationsRouter.get('/unread/count', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const count = await storage.getUnreadNotificationsCount(userId);
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({ message: 'Failed to fetch unread notifications count' });
  }
});

// POST /api/notifications/mark-read/:id - Mark a specific notification as read
notificationsRouter.post('/mark-read/:id', requireAuth, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const success = await storage.markNotificationAsRead(notificationId);
    
    if (success) {
      res.status(200).json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/mark-all-read - Mark all user's notifications as read
notificationsRouter.post('/mark-all-read', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const success = await storage.markAllNotificationsAsRead(userId);
    
    if (success) {
      res.status(200).json({ message: 'All notifications marked as read' });
    } else {
      res.status(200).json({ message: 'No unread notifications found' });
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// POST /api/notifications/test - Create a test notification (for development purposes)
notificationsRouter.post('/test', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const testNotification = {
      userId,
      title: 'Test Notification',
      message: 'This is a test notification created at ' + new Date().toLocaleString(),
      type: 'system',
      link: null
    };
    
    const notification = await storage.createNotification(testNotification);
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ message: 'Failed to create test notification' });
  }
});

export default notificationsRouter;