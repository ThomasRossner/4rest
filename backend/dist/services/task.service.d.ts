import { Location } from './location.service.js';
/**
 * Generiert oder ruft den QR-Code einer Aufgabe ab
 */
export declare function generateOrGetTaskQrCode(taskId: string): Promise<string | null>;
type TaskRecurrence = 'once' | 'daily' | 'weekly' | 'monthly';
export interface Task {
    id: string;
    title: string;
    description?: string;
    title_i18n?: Record<string, string>;
    description_i18n?: Record<string, string>;
    article_content_i18n?: Record<string, string>;
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
    thumbnail_url?: string;
    allowed_teams?: string[] | null;
    allowed_contests?: string[] | null;
}
export declare function getAllTasks(filters?: {
    limit?: number;
    offset?: number;
    type?: string;
}, userId?: string, options?: {
    includeAll?: boolean;
    includeInactive?: boolean;
    preferredLanguage?: string;
}): Promise<any[]>;
export declare function isQuizAnswerCorrect(params: {
    questionAnswers: any[];
    expectedAnswerId: string | null;
    expectedAnswerText: string | null;
    selectedAnswerId: string | null;
    selectedAnswerText: string | null;
}): boolean;
export declare function resolveQuizQuestionsI18n(payload: any, lang: 'de' | 'en'): any[];
export declare function resolveSurveyQuestionsI18n(payload: any, lang: 'de' | 'en'): any[];
export declare function getTaskById(id: string, preferredLanguage?: string): Promise<Task | null>;
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
    requiresVerification: any;
}>;
/** Öffentliche URL für eine Datei im gemeinsamen Upload-Verzeichnis (gleiche Logik wie Aufgaben-Fotos/Videos). */
export declare function publicUploadFileUrl(filename: string): string;
export declare function uploadPhoto(file: Express.Multer.File): Promise<string>;
export declare function uploadVideo(file: Express.Multer.File): Promise<string>;
export declare function uploadThumbnail(file: Express.Multer.File): Promise<string>;
/**
 * Approve a photo task - awards points and adds photo to gallery
 */
export declare function approvePhotoTask(userTaskId: string, verifiedByUserId: string): Promise<{
    success: boolean;
    pointsEarned: any;
    message: string;
}>;
/**
 * Reject a photo task - deletes photo and notifies user via mailbox
 */
export declare function rejectPhotoTask(userTaskId: string, verifiedByUserId: string, rejectionReason?: string): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Get all pending photo tasks for verification
 */
export declare function getPendingPhotoTasks(): Promise<any[]>;
/**
 * Get gallery images (approved photos)
 */
export declare function getGalleryImages(filters?: {
    userId?: string;
    taskId?: string;
    limit?: number;
    offset?: number;
}): Promise<any[]>;
/**
 * Checks if all prerequisites for a task are met by a user
 * @param taskId Task ID to check prerequisites for
 * @param userId User ID to check completion for
 * @returns true if all prerequisites are met, false otherwise
 */
export declare function checkPrerequisiteMet(taskId: string, userId: string): Promise<boolean>;
export {};
//# sourceMappingURL=task.service.d.ts.map