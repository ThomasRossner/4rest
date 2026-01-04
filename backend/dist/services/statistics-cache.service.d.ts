import { Statistics } from './statistics.service.js';
/**
 * Cache statistics in database for fast retrieval
 */
export declare function updateStatisticsCache(statistics: Statistics): Promise<void>;
/**
 * Get cached statistics (faster than recalculating)
 */
export declare function getCachedStatistics(): Promise<Partial<Statistics>>;
//# sourceMappingURL=statistics-cache.service.d.ts.map