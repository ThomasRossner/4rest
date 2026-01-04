/**
 * Get forest data for a specific user
 * Each user has their own unique forest with trees positioned in a grid layout
 */
export declare function getForestService(userId: string): Promise<{
    areas: {
        origin: [number, number, number];
        trees: any[];
    }[];
    trees: any[];
    totalTrees: number;
    totalAreas: number;
}>;
export declare function getUserForestService(userId: string): Promise<{
    trees: {
        id: any;
        treeType: any;
        position: any[];
        plantedAt: any;
        growthPoints: any;
        stage: any;
        size: number;
        taskTitle: any;
    }[];
    totalTrees: number;
}>;
/**
 * Get aggregated forest statistics for all users.
 * Used for admin/debug views so we can avoid manual psql inspection.
 */
export declare function getForestStatsService(): Promise<any[]>;
//# sourceMappingURL=forest.service.d.ts.map