/**
 * Tree System Components
 * 
 * Export all tree-related components for easy importing
 */

export { default as TreeComponent, type AnimatedTreeProps, type TreeComponentRef } from './TreeComponent';
export { default as Leaves } from './Leaves';
export { 
  mapGrowthPointsToCounter, 
  shouldShowTwig, 
  calculateTwigScale, 
  round 
} from './growthMapper';

