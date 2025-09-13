import { Router } from 'express';
import { getOpenAILogs, getUsageStatsByModel, getUsageStatsByUser, exportLogsAsCSV } from '../utils/openai-logger';

/**
 * Register OpenAI logs routes
 * These routes allow admins to access OpenAI API usage logs and statistics
 */
export function registerOpenAILogsRoutes(router: Router): void {
  // Utility function to require admin role
  function requireAdmin(req: any, res: any, next: any) {
    const user = req.user;
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }

  // Get all OpenAI API call logs
  router.get('/admin/openai-logs', requireAdmin, (req: any, res: any) => {
    try {
      const logs = getOpenAILogs();
      res.json(logs);
    } catch (error) {
      console.error('Error fetching OpenAI logs:', error);
      res.status(500).json({ error: 'Failed to fetch OpenAI logs' });
    }
  });

  // Get OpenAI usage statistics by model
  router.get('/admin/openai-stats/models', requireAdmin, (req: any, res: any) => {
    try {
      const stats = getUsageStatsByModel();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching OpenAI model stats:', error);
      res.status(500).json({ error: 'Failed to fetch OpenAI model statistics' });
    }
  });

  // Get OpenAI usage statistics by user
  router.get('/admin/openai-stats/users', requireAdmin, (req: any, res: any) => {
    try {
      const stats = getUsageStatsByUser();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching OpenAI user stats:', error);
      res.status(500).json({ error: 'Failed to fetch OpenAI user statistics' });
    }
  });

  // Export logs as CSV
  router.get('/admin/openai-logs/export', requireAdmin, (req: any, res: any) => {
    try {
      const csv = exportLogsAsCSV();
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="openai-logs.csv"');
      
      res.send(csv);
    } catch (error) {
      console.error('Error exporting OpenAI logs:', error);
      res.status(500).json({ error: 'Failed to export OpenAI logs' });
    }
  });
}