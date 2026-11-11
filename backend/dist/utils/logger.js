/**
 * Simple logger utility for debug operations
 * In production, consider using a proper logging library like Winston or Pino
 */
// In-memory log store (last 1000 entries)
const logStore = [];
const MAX_LOG_ENTRIES = 1000;
function formatLogEntry(entry) {
    const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
        `[${entry.operation}]`,
    ];
    if (entry.userId) {
        parts.push(`[User: ${entry.userId}]`);
    }
    if (entry.userEmail) {
        parts.push(`[Email: ${entry.userEmail}]`);
    }
    parts.push(entry.message);
    if (entry.details && Object.keys(entry.details).length > 0) {
        parts.push(`Details: ${JSON.stringify(entry.details)}`);
    }
    return parts.join(' ');
}
function addToStore(entry) {
    logStore.push(entry);
    // Keep only the last MAX_LOG_ENTRIES entries
    if (logStore.length > MAX_LOG_ENTRIES) {
        logStore.shift();
    }
}
export const logger = {
    info(operation, message, metadata) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            operation,
            message,
            ...metadata,
        };
        console.log(formatLogEntry(entry));
        addToStore(entry);
    },
    warn(operation, message, metadata) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'warn',
            operation,
            message,
            ...metadata,
        };
        console.warn(formatLogEntry(entry));
        addToStore(entry);
    },
    error(operation, message, metadata) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'error',
            operation,
            message,
            ...metadata,
            details: {
                ...metadata?.details,
                ...(metadata?.error ? { error: metadata.error.message, stack: metadata.error.stack } : {}),
            },
        };
        console.error(formatLogEntry(entry));
        addToStore(entry);
    },
    /**
     * Get logs from the store
     * @param limit - Maximum number of logs to return (default: 100)
     * @param level - Filter by log level (optional)
     * @param operation - Filter by operation name (optional)
     */
    getLogs(limit = 100, level, operation) {
        let filtered = [...logStore];
        if (level) {
            filtered = filtered.filter(entry => entry.level === level);
        }
        if (operation) {
            filtered = filtered.filter(entry => entry.operation === operation);
        }
        // Return most recent entries first
        return filtered.slice(-limit).reverse();
    },
    /**
     * Clear all logs from the store
     */
    clearLogs() {
        logStore.length = 0;
    },
};
//# sourceMappingURL=logger.js.map