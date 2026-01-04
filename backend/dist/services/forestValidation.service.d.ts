/**
 * Forest Validation Service
 *
 * Provides async execution of forest validation and fixing without process.exit calls.
 * Used by the admin API endpoint.
 */
export interface ValidationJobStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: {
        currentUser: number;
        totalUsers: number;
        currentUserEmail?: string;
    };
    result?: {
        usersProcessed: number;
        totalFixed: number;
        totalDeleted: number;
        totalMoved: number;
        totalErrors: number;
        errors: string[];
    };
    error?: string;
    startedAt: Date;
    completedAt?: Date;
}
/**
 * Run forest validation and fixing asynchronously.
 * Returns immediately with a job ID.
 */
export declare function runForestValidation(dryRun: boolean, forceGeometry: boolean, userFilter?: string): Promise<string>;
/**
 * Get the status of a validation job.
 */
export declare function getValidationJobStatus(jobId: string): ValidationJobStatus | null;
/**
 * Clean up old completed jobs (older than 1 hour).
 */
export declare function cleanupOldJobs(): void;
//# sourceMappingURL=forestValidation.service.d.ts.map