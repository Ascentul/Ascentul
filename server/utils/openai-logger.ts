import fs from 'fs';
import path from 'path';

// Define the log entry structure
export interface OpenAILogEntry {
  userId: string | number;
  timestamp: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  endpoint?: string;
  status?: 'success' | 'error';
  error?: string;
}

// Constants for the log file
const LOG_FILE_PATH = './logs/openai-usage.json';
const LOG_DIR = './logs';

// Ensure the logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Initialize the log file if it doesn't exist
if (!fs.existsSync(LOG_FILE_PATH)) {
  fs.writeFileSync(LOG_FILE_PATH, JSON.stringify({ logs: [] }));
}

/**
 * Log an OpenAI API call with usage information
 */
export function logOpenAIUsage(logEntry: OpenAILogEntry): void {
  try {
    // Read the current log file
    const logFileContent = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    const logData = JSON.parse(logFileContent);
    
    // Add the new log entry
    logData.logs.push(logEntry);
    
    // Write the updated logs back to the file
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logData, null, 2));
    
    // Also log to console for immediate visibility
    console.log(`OpenAI API call logged: ${logEntry.model}, tokens: ${logEntry.total_tokens}`);
  } catch (error) {
    console.error('Error logging OpenAI usage:', error);
  }
}

/**
 * Get all logged OpenAI API calls
 */
export function getOpenAILogs(): OpenAILogEntry[] {
  try {
    const logFileContent = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    const logData = JSON.parse(logFileContent);
    return logData.logs || [];
  } catch (error) {
    console.error('Error reading OpenAI logs:', error);
    return [];
  }
}

/**
 * Export the logs as CSV
 */
export function exportLogsAsCSV(): string {
  try {
    const logs = getOpenAILogs();
    
    if (logs.length === 0) {
      return 'No logs found';
    }
    
    // Generate CSV header from the first log's keys
    const headers = Object.keys(logs[0]).join(',');
    
    // Generate CSV rows
    const rows = logs.map(log => {
      return Object.values(log)
        .map(value => {
          // Handle strings with commas by wrapping in quotes
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',');
    });
    
    // Combine header and rows
    return [headers, ...rows].join('\n');
  } catch (error) {
    console.error('Error exporting logs as CSV:', error);
    return 'Error generating CSV';
  }
}

/**
 * Clear all logs (mainly for testing)
 */
export function clearLogs(): void {
  try {
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify({ logs: [] }));
    console.log('OpenAI logs cleared');
  } catch (error) {
    console.error('Error clearing logs:', error);
  }
}

/**
 * Get usage statistics by model
 */
export function getUsageStatsByModel(): Record<string, { 
  calls: number; 
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}> {
  const logs = getOpenAILogs();
  const stats: Record<string, any> = {};
  
  logs.forEach(log => {
    if (!stats[log.model]) {
      stats[log.model] = {
        calls: 0,
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0
      };
    }
    
    stats[log.model].calls += 1;
    stats[log.model].total_tokens += log.total_tokens || 0;
    stats[log.model].prompt_tokens += log.prompt_tokens || 0;
    stats[log.model].completion_tokens += log.completion_tokens || 0;
  });
  
  return stats;
}

/**
 * Get usage statistics by user
 */
export function getUsageStatsByUser(): Record<string, { 
  calls: number; 
  total_tokens: number;
}> {
  const logs = getOpenAILogs();
  const stats: Record<string, any> = {};
  
  logs.forEach(log => {
    const userId = String(log.userId);
    
    if (!stats[userId]) {
      stats[userId] = {
        calls: 0,
        total_tokens: 0
      };
    }
    
    stats[userId].calls += 1;
    stats[userId].total_tokens += log.total_tokens || 0;
  });
  
  return stats;
}