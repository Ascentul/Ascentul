import { Express, Request, Response } from 'express';
import { requireAdmin } from '../auth';
import {
  getOpenAILogs,
  getUsageStatsByModel,
  getUsageStatsByUser,
  exportLogsAsCSV
} from '../utils/openai-logger';

/**
 * Register API routes for OpenAI usage logs
 */
export function registerOpenAILogsRoutes(app: Express) {
  // Get all OpenAI logs (admin only)
  app.get('/api/admin/openai-logs', requireAdmin, (req: Request, res: Response) => {
    try {
      const logs = getOpenAILogs();
      res.status(200).json({
        success: true,
        logs
      });
    } catch (error) {
      console.error('Error retrieving OpenAI logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve OpenAI logs'
      });
    }
  });

  // Get usage statistics by model (admin only)
  app.get('/api/admin/openai-stats/models', requireAdmin, (req: Request, res: Response) => {
    try {
      const stats = getUsageStatsByModel();
      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error retrieving OpenAI usage stats by model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage statistics'
      });
    }
  });

  // Get usage statistics by user (admin only)
  app.get('/api/admin/openai-stats/users', requireAdmin, (req: Request, res: Response) => {
    try {
      const stats = getUsageStatsByUser();
      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error retrieving OpenAI usage stats by user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage statistics'
      });
    }
  });

  // Export logs as CSV (admin only)
  app.get('/api/admin/openai-logs/export', requireAdmin, (req: Request, res: Response) => {
    try {
      const csv = exportLogsAsCSV();
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="openai-usage-logs.csv"');
      
      res.status(200).send(csv);
    } catch (error) {
      console.error('Error exporting OpenAI logs as CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export logs as CSV'
      });
    }
  });
}