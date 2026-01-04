import axios from 'axios';
import { getPool } from '../database/connection.js';
import { createTask, getAllTasks } from '../services/task.service.js';
class HotelKitIntegration {
    config;
    client;
    isEnabled;
    constructor() {
        this.config = {
            apiUrl: process.env.HOTELKIT_API_URL || '',
            apiKey: process.env.HOTELKIT_API_KEY || '',
            hotelId: process.env.HOTELKIT_HOTEL_ID,
        };
        this.isEnabled = !!(this.config.apiUrl && this.config.apiKey);
        if (!this.isEnabled) {
            console.log('HotelKit integration disabled - API credentials not configured');
            return;
        }
        this.client = axios.create({
            baseURL: this.config.apiUrl,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
                'X-Hotel-ID': this.config.hotelId || '',
            },
            timeout: 15000, // 15 second timeout
        });
    }
    /**
     * Sync employee tasks from HotelKit
     */
    async syncEmployeeTasks() {
        if (!this.isEnabled || !this.client) {
            console.log('HotelKit integration is disabled');
            return { synced: 0, errors: 0 };
        }
        try {
            // Fetch tasks from HotelKit
            const response = await this.client.get('/tasks/employees', {
                params: {
                    status: 'active',
                    includeCompleted: false,
                },
            });
            const hotelKitTasks = response.data.tasks || response.data || [];
            let synced = 0;
            let errors = 0;
            // Get existing tasks to avoid duplicates
            const existingTasks = await getAllTasks(undefined, undefined, { includeAll: true });
            const existingExternalIds = new Set(existingTasks
                .filter((t) => t.external_id)
                .map((t) => t.external_id));
            // Sync each task
            for (const hkTask of hotelKitTasks) {
                try {
                    // Skip if already synced
                    if (existingExternalIds.has(`hotelkit_${hkTask.id}`)) {
                        continue;
                    }
                    // Convert HotelKit task to Roots of Impact task
                    await createTask({
                        title: hkTask.title,
                        description: hkTask.description || `Synced from HotelKit: ${hkTask.category || 'General'}`,
                        type: this.mapTaskType(hkTask.category),
                        points: this.calculatePoints(hkTask),
                        external_id: `hotelkit_${hkTask.id}`,
                        co2_savings_kg: this.estimateCO2Savings(hkTask),
                    });
                    synced++;
                }
                catch (error) {
                    console.error(`Error syncing HotelKit task ${hkTask.id}:`, error.message);
                    errors++;
                }
            }
            console.log(`HotelKit sync completed: ${synced} tasks synced, ${errors} errors`);
            return { synced, errors };
        }
        catch (error) {
            console.error('HotelKit sync error:', error.message);
            throw new Error(`Failed to sync with HotelKit: ${error.message}`);
        }
    }
    /**
     * Mark task as completed in HotelKit
     */
    async markTaskCompleted(taskId, employeeId) {
        if (!this.isEnabled || !this.client) {
            return false;
        }
        try {
            // Extract HotelKit task ID from our task
            const db = getPool();
            const taskResult = await db.query('SELECT external_id FROM tasks WHERE id = $1', [taskId]);
            if (!taskResult.rows[0]?.external_id?.startsWith('hotelkit_')) {
                return false; // Not a HotelKit task
            }
            const hotelKitTaskId = taskResult.rows[0].external_id.replace('hotelkit_', '');
            const response = await this.client.post(`/tasks/${hotelKitTaskId}/complete`, {
                employeeId,
                completedAt: new Date().toISOString(),
            });
            return response.data.success !== false;
        }
        catch (error) {
            console.error('Error marking task as completed in HotelKit:', error.message);
            return false;
        }
    }
    /**
     * Get employee information from HotelKit
     */
    async getEmployee(employeeId) {
        if (!this.isEnabled || !this.client) {
            return null;
        }
        try {
            const response = await this.client.get(`/employees/${employeeId}`);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching employee ${employeeId} from HotelKit:`, error.message);
            return null;
        }
    }
    /**
     * Map HotelKit task category to Roots of Impact task type
     */
    mapTaskType(category) {
        const categoryMap = {
            sustainability: 'qr',
            training: 'video',
            maintenance: 'photo',
            cleaning: 'photo',
            default: 'qr',
        };
        return categoryMap[category?.toLowerCase() || 'default'] || 'qr';
    }
    /**
     * Calculate points based on HotelKit task
     */
    calculatePoints(task) {
        // Base points
        let points = 10;
        // Bonus points for sustainability-related tasks
        if (task.category?.toLowerCase().includes('sustainability') ||
            task.title?.toLowerCase().includes('sustainability')) {
            points += 20;
        }
        // Urgency bonus
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 1) {
                points += 10; // Urgent task bonus
            }
        }
        return Math.min(points, 100); // Cap at 100 points
    }
    /**
     * Estimate CO₂ savings based on task
     */
    estimateCO2Savings(task) {
        // Estimated CO₂ savings in kg per task completion
        const estimates = {
            sustainability: 5.0,
            cleaning: 1.0,
            maintenance: 2.0,
            training: 0.5,
            default: 1.0,
        };
        const category = task.category?.toLowerCase() || 'default';
        return estimates[category] || estimates.default;
    }
    /**
     * Setup webhook for HotelKit events
     */
    async setupWebhook(webhookUrl) {
        if (!this.isEnabled || !this.client) {
            return false;
        }
        try {
            const response = await this.client.post('/webhooks', {
                url: webhookUrl,
                events: ['task.completed', 'task.created', 'employee.updated'],
            });
            return response.data.success !== false;
        }
        catch (error) {
            console.error('Error setting up HotelKit webhook:', error.message);
            return false;
        }
    }
}
export const hotelKit = new HotelKitIntegration();
//# sourceMappingURL=hotelkit.js.map