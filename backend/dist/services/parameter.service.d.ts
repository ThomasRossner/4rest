export interface TaskParameter {
    id: string;
    parameter_type: 'type' | 'category' | 'difficulty' | 'time_required' | 'location_tool';
    value: string;
    display_order: number;
    weight?: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}
export interface RewardParameter {
    id: string;
    parameter_type: 'reward_art' | 'kategorie' | 'kosten';
    value: string;
    display_order: number;
    weight?: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}
export declare function getTaskParameters(parameterType?: string): Promise<TaskParameter[]>;
export declare function getRewardParameters(parameterType?: string): Promise<RewardParameter[]>;
export declare function createTaskParameter(parameterType: string, value: string, displayOrder?: number, weight?: number): Promise<TaskParameter>;
export declare function createRewardParameter(parameterType: string, value: string, displayOrder?: number, weight?: number): Promise<RewardParameter>;
export declare function updateTaskParameter(id: string, updates: {
    value?: string;
    display_order?: number;
    weight?: number;
    active?: boolean;
}): Promise<TaskParameter>;
export declare function updateRewardParameter(id: string, updates: {
    value?: string;
    display_order?: number;
    weight?: number;
    active?: boolean;
}): Promise<RewardParameter>;
export declare function deleteTaskParameter(id: string): Promise<void>;
export declare function deleteRewardParameter(id: string): Promise<void>;
//# sourceMappingURL=parameter.service.d.ts.map