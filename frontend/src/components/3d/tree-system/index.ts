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

export {
  computeModularTreeGrowth2a,
  MAX_GROWTH_POINTS_NORM,
  MAX_FOREST_CATEGORY_POINTS_NORM,
  type ForestPointsRecord,
} from './growthFactor2a';
export { default as ControllableTree, type ControllableTreeProps } from './ControllableTree';
export { default as SceneController, type SceneControllerProps } from './SceneController';
