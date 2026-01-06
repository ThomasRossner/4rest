import { Location } from './location.service.js';
type TaskRecurrence = 'once' | 'daily' | 'weekly' | 'monthly';
export interface Task {
    id: string;
    title: string;
    description?: string;
    type: string;
    points: number;
    video_url?: string;
    quiz_questions?: any;
    qr_code?: string;
    photo_required?: boolean;
    co2_savings_kg?: number;
    external_id?: string;
    location_id: string;
    location?: Location;
    active?: boolean;
    recurrence?: TaskRecurrence;
    target_latitude?: number;
    target_longitude?: number;
    article_url?: string;
    article_content?: string;
    survey_questions?: any;
    survey_type?: string;
    prerequisite_task_id?: string;
    prerequisite_task_count?: number;
    prerequisite_task_ids?: string[];
    is_available?: boolean;
    category?: 'Kommunikation & Netzwerke' | 'Mensch & soziales Umfeld' | 'Natur & Umweltschutz' | 'Ressourcenverbrauch & Materialeinsatz';
    difficulty?: 'sehr einfach' | 'einfach' | 'mittel' | 'schwer' | 'sehr schwer';
    time_required?: '1-3 Min' | '3-10 Min' | '10-30 Min' | '30-60 Min' | '60+ Min';
    location_tool?: 'Umgebung' | 'Hotel' | 'egal' | 'Smartphone/PC';
    event_group?: string;
    zielgruppe?: ('Mitarbeitende' | 'Gäste' | 'Stakeholder')[];
}
export declare function getAllTasks(filters?: {
    limit?: number;
    offset?: number;
    type?: string;
}, userId?: string, options?: {
    includeAll?: boolean;
    includeInactive?: boolean;
}): Promise<any[]>;
export declare function getTaskById(id: string): Promise<Task | null>;
/**
 * Calculate task points automatically based on difficulty and time_required weights
 * Formula: (difficulty_weight * time_required_weight) / factor
 * Returns the calculated points, or null if calculation is not possible
 */
export declare function calculateTaskPoints(difficulty?: string | null, time_required?: string | null): Promise<number | null>;
export declare function createTask(data: Partial<Task>): Promise<Task>;
export declare function updateTask(id: string, data: Partial<Task>): Promise<Task | null>;
export declare function deleteTask(id: string): Promise<void>;
export declare function setTasksActiveState(ids: string[], active: boolean): Promise<void>;
export declare function bulkDeleteTasks(ids: string[]): Promise<void>;
export declare function completeTask(taskId: string, userId: string, data?: any): Promise<{
    success: boolean;
    pointsEarned: number;
    message: string;
}>;
export declare function uploadPhoto(file: Express.Multer.File): Promise<string>;
export declare function uploadVideo(file: Express.Multer.File): Promise<string>;
/**
 * Checks if all prerequisites for a task are met by a user
 * @param taskId Task ID to check prerequisites for
 * @param userId User ID to check completion for
 * @returns true if all prerequisites are met, false otherwise
 */
export declare function checkPrerequisiteMet(taskId: string, userId: string): Promise<boolean>;
export {};
//# sourceMappingURL=task.service.d.ts.map