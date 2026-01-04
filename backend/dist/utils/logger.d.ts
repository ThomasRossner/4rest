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
export declare const logger: {
    info(operation: string, message: string, metadata?: {
        userId?: string;
        userEmail?: string;
        details?: Record<string, unknown>;
    }): void;
    warn(operation: string, message: string, metadata?: {
        userId?: string;
        userEmail?: string;
        details?: Record<string, unknown>;
    }): void;
    error(operation: string, message: string, metadata?: {
        userId?: string;
        userEmail?: string;
        details?: Record<string, unknown>;
        error?: Error;
    }): void;
    /**
     * Get logs from the store
     * @param limit - Maximum number of logs to return (default: 100)
     * @param level - Filter by log level (optional)
     * @param operation - Filter by operation name (optional)
     */
    getLogs(limit?: number, level?: LogLevel, operation?: string): LogEntry[];
    /**
     * Clear all logs from the store
     */
    clearLogs(): void;
};
export {};
//# sourceMappingURL=logger.d.ts.map