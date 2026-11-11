export interface SurveyAnalytics {
    taskId: string;
    taskTitle: string;
    totalResponses: number;
    questions: SurveyQuestionAnalytics[];
}
export interface SurveyQuestionAnalytics {
    questionId: string;
    questionText: string;
    type: 'single_choice' | 'multiple_choice' | 'text' | 'rating';
    responses: {
        options?: {
            [option: string]: number;
        };
        average?: number;
        distribution?: {
            [rating: number]: number;
        };
        responseCount?: number;
    };
}
/**
 * Get aggregated survey analytics for a specific task or all survey tasks
 * All data is anonymized - no user information is included
 */
export declare function getSurveyAnalytics(taskId?: string): Promise<SurveyAnalytics[]>;
//# sourceMappingURL=survey.service.d.ts.map