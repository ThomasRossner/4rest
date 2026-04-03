import { RequestHandler } from 'express';
/** GET /api/tasks/public/:id — ohne JWT (Cookie Gast-Session). */
export declare const getPublicTask: RequestHandler;
/** POST /api/tasks/public/:id/complete */
export declare const completePublicTask: RequestHandler;
export declare const getTasks: RequestHandler;
export declare const getTask: RequestHandler;
export declare const createTask: RequestHandler;
export declare const updateTask: RequestHandler;
export declare const deleteTask: RequestHandler;
export declare const bulkUpdateTaskStatus: RequestHandler;
export declare const bulkDeleteTasks: RequestHandler;
export declare const submitQuizAnswer: RequestHandler;
export declare const completeTask: RequestHandler;
export declare const uploadPhoto: RequestHandler;
export declare const uploadVideo: RequestHandler;
export declare const uploadThumbnail: RequestHandler;
export declare const approvePhotoTask: RequestHandler;
export declare const rejectPhotoTask: RequestHandler;
export declare const getPendingPhotoTasks: RequestHandler;
export declare const getGallery: RequestHandler;
/**
 * GET /api/tasks/:id/qr-code
 * Ruft den QR-Code einer Aufgabe ab (nur für Administratoren und Redaktion)
 * Generiert automatisch einen QR-Code, falls noch keiner existiert
 */
export declare const getTaskQrCode: RequestHandler;
//# sourceMappingURL=task.controller.d.ts.map