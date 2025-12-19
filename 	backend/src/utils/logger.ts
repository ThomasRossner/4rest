/**
 * Simple logger utility for debug operations
 * In production, consider using a proper logging library like Winston or Pino
 */

type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  userId?: string;
  userEmail?: string;
  details?: Record<string, unknown>;
  message: string;
}

// In-memory log store (last 1000 entries)
const logStore: LogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;

function formatLogEntry(entry: LogEntry): string {
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

function addToStore(entry: LogEntry) {
  logStore.push(entry);
  
  // Keep only the last MAX_LOG_ENTRIES entries
  if (logStore.length > MAX_LOG_ENTRIES) {
    logStore.shift();
  }
}

export const logger = {
  info(operation: string, message: string, metadata?: { userId?: string; userEmail?: string; details?: Record<string, unknown> }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      operation,
      message,
      ...metadata,
    };
    console.log(formatLogEntry(entry));
    addToStore(entry);
  },

  warn(operation: string, message: string, metadata?: { userId?: string; userEmail?: string; details?: Record<string, unknown> }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      operation,
      message,
      ...metadata,
    };
    console.warn(formatLogEntry(entry));
    addToStore(entry);
  },

  error(operation: string, message: string, metadata?: { userId?: string; userEmail?: string; details?: Record<string, unknown>; error?: Error }) {
    const entry: LogEntry = {
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
  getLogs(limit: number = 100, level?: LogLevel, operation?: string): LogEntry[] {
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

