declare class HotelKitIntegration {
    private config;
    private client?;
    private isEnabled;
    constructor();
    /**
     * Sync employee tasks from HotelKit
     */
    syncEmployeeTasks(): Promise<{
        synced: number;
        errors: number;
    }>;
    /**
     * Mark task as completed in HotelKit
     */
    markTaskCompleted(taskId: string, employeeId: string): Promise<boolean>;
    /**
     * Get employee information from HotelKit
     */
    getEmployee(employeeId: string): Promise<any>;
    /**
     * Map HotelKit task category to 4rest task type
     */
    private mapTaskType;
    /**
     * Calculate points based on HotelKit task
     */
    private calculatePoints;
    /**
     * Estimate CO₂ savings based on task
     */
    private estimateCO2Savings;
    /**
     * Setup webhook for HotelKit events
     */
    setupWebhook(webhookUrl: string): Promise<boolean>;
}
export declare const hotelKit: HotelKitIntegration;
export {};
//# sourceMappingURL=hotelkit.d.ts.map