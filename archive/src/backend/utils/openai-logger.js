/**
 * OpenAI Usage Logger
 *
 * This utility keeps track of OpenAI API usage metrics for cost tracking and monitoring.
 * Logs are stored in memory and can be accessed through APIs for administrator viewing.
 */
// In-memory storage for logs
const logs = [];
/**
 * Log an OpenAI API call with usage information
 */
export function logOpenAIUsage(logEntry) {
    // Add log to the beginning of the array for most recent first
    logs.unshift(logEntry);
    // Cap the log size to prevent memory issues (store last 1000 entries)
    if (logs.length > 1000) {
        logs.pop();
    }
    // Also log to console for debugging

}
/**
 * Get all logged OpenAI API calls
 */
export function getOpenAILogs() {
    return logs;
}
/**
 * Export the logs as CSV
 */
export function exportLogsAsCSV() {
    // Define CSV headers
    const headers = ['userId', 'timestamp', 'model', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'endpoint', 'status', 'error'];
    // Create CSV content with headers
    let csv = headers.join(',') + '\n';
    // Add each log entry as a row
    logs.forEach(log => {
        const row = [
            log.userId,
            log.timestamp,
            log.model,
            log.prompt_tokens,
            log.completion_tokens,
            log.total_tokens,
            log.endpoint || '',
            log.status || '',
            // Escape quotes in error message
            log.error ? `"${log.error.replace(/"/g, '""')}"` : ''
        ];
        csv += row.join(',') + '\n';
    });
    return csv;
}
/**
 * Clear all logs (mainly for testing)
 */
export function clearLogs() {
    logs.length = 0;
}
/**
 * Get usage statistics by model
 */
export function getUsageStatsByModel() {
    const stats = {};
    // Process each log entry
    logs.forEach(log => {
        // Initialize model entry if it doesn't exist
        if (!stats[log.model]) {
            stats[log.model] = {
                requests: 0,
                success_requests: 0,
                error_requests: 0,
                total_tokens: 0,
                prompt_tokens: 0,
                completion_tokens: 0,
                estimated_cost: 0
            };
        }
        // Add stats
        stats[log.model].requests++;
        if (log.status === 'success') {
            stats[log.model].success_requests++;
            stats[log.model].total_tokens += log.total_tokens;
            stats[log.model].prompt_tokens += log.prompt_tokens;
            stats[log.model].completion_tokens += log.completion_tokens;
            // Calculate estimated cost based on model
            // These rates are approximate and should be updated as pricing changes
            let costPerInputToken = 0;
            let costPerOutputToken = 0;
            if (log.model.includes('gpt-4-turbo') || log.model.includes('gpt-4o')) {
                costPerInputToken = 0.00001; // $0.01 per 1K input tokens
                costPerOutputToken = 0.00003; // $0.03 per 1K output tokens
            }
            else if (log.model.includes('gpt-4')) {
                costPerInputToken = 0.00003; // $0.03 per 1K input tokens
                costPerOutputToken = 0.00006; // $0.06 per 1K output tokens
            }
            else if (log.model.includes('gpt-3.5-turbo')) {
                costPerInputToken = 0.0000005; // $0.0005 per 1K input tokens
                costPerOutputToken = 0.0000015; // $0.0015 per 1K output tokens
            }
            const inputCost = log.prompt_tokens * costPerInputToken;
            const outputCost = log.completion_tokens * costPerOutputToken;
            stats[log.model].estimated_cost += inputCost + outputCost;
        }
        else {
            stats[log.model].error_requests++;
        }
    });
    return stats;
}
/**
 * Get usage statistics by user
 */
export function getUsageStatsByUser() {
    const stats = {};
    // Process each log entry
    logs.forEach(log => {
        const userId = String(log.userId);
        // Initialize user entry if it doesn't exist
        if (!stats[userId]) {
            stats[userId] = {
                requests: 0,
                total_tokens: 0,
                models_used: [],
                estimated_cost: 0
            };
        }
        // Add stats
        stats[userId].requests++;
        if (log.status === 'success') {
            stats[userId].total_tokens += log.total_tokens;
            // Add model to used models if not already there
            if (!stats[userId].models_used.includes(log.model)) {
                stats[userId].models_used.push(log.model);
            }
            // Calculate estimated cost based on model
            let costPerInputToken = 0;
            let costPerOutputToken = 0;
            if (log.model.includes('gpt-4-turbo') || log.model.includes('gpt-4o')) {
                costPerInputToken = 0.00001; // $0.01 per 1K input tokens
                costPerOutputToken = 0.00003; // $0.03 per 1K output tokens
            }
            else if (log.model.includes('gpt-4')) {
                costPerInputToken = 0.00003; // $0.03 per 1K input tokens
                costPerOutputToken = 0.00006; // $0.06 per 1K output tokens
            }
            else if (log.model.includes('gpt-3.5-turbo')) {
                costPerInputToken = 0.0000005; // $0.0005 per 1K input tokens
                costPerOutputToken = 0.0000015; // $0.0015 per 1K output tokens
            }
            const inputCost = log.prompt_tokens * costPerInputToken;
            const outputCost = log.completion_tokens * costPerOutputToken;
            stats[userId].estimated_cost += inputCost + outputCost;
        }
    });
    return stats;
}
