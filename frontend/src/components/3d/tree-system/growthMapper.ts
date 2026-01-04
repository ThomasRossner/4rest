/**
 * Growth Mapper Utility
 * Maps database growth_points (1-100+) to animation state for tree growth
 */

/**
 * Map growth points to growth counter for trunk animation
 * @param growthPoints - Growth points from database (1-100+)
 * @param trunkGrowSteps - Number of steps for trunk growth (default: 20)
 * @param maxGrowthPoints - Maximum growth points for full animation (default: 100)
 * @returns Growth counter value (0 to trunkGrowSteps)
 */
export function mapGrowthPointsToCounter(
  growthPoints: number,
  trunkGrowSteps: number = 20,
  maxGrowthPoints: number = 100
): number {
  // Map growth points (1-100+) to growth counter (0-20)
  // Ensure minimum growth counter of 1 for any growthPoints > 0 to make tree visible
  const normalizedPoints = Math.min(Math.max(growthPoints, 0), maxGrowthPoints);
  const counter = Math.floor((normalizedPoints / maxGrowthPoints) * trunkGrowSteps);
  // Return at least 1 if there are any growth points, so tree is visible
  return growthPoints > 0 ? Math.max(1, counter) : 0;
}

/**
 * Determine if a twig should be visible based on growth counter
 * @param twigIndex - Index of the twig (0-based)
 * @param growthCounter - Current growth counter (0 to trunkGrowSteps)
 * @param trunkGrowSteps - Number of steps for trunk growth
 * @param totalTwigs - Total number of twigs in the tree
 * @returns Whether the twig should be visible
 */
export function shouldShowTwig(
  twigIndex: number,
  growthCounter: number,
  trunkGrowSteps: number,
  totalTwigs: number
): boolean {
  // Twig appears when growthCounter reaches certain threshold
  // Distribute twig appearance evenly across trunk growth
  if (totalTwigs === 0) return false;
  const threshold = Math.floor(((twigIndex + 1) / totalTwigs) * trunkGrowSteps);
  return growthCounter >= threshold;
}

/**
 * Calculate twig scale based on growth counter and twig index
 * @param twigIndex - Index of the twig (0-based)
 * @param growthCounter - Current growth counter (0 to trunkGrowSteps)
 * @param trunkGrowSteps - Number of steps for trunk growth
 * @param twigGrowSteps - Number of steps for twig growth (default: 8)
 * @param totalTwigs - Total number of twigs
 * @returns Scale value for the twig (0 to 1)
 */
export function calculateTwigScale(
  twigIndex: number,
  growthCounter: number,
  trunkGrowSteps: number,
  twigGrowSteps: number = 8,
  totalTwigs: number
): number {
  if (!shouldShowTwig(twigIndex, growthCounter, trunkGrowSteps, totalTwigs)) {
    return 0;
  }

  // Calculate when this twig starts growing
  const startThreshold = Math.floor(((twigIndex + 1) / totalTwigs) * trunkGrowSteps);
  
  // Calculate progress through twig growth
  const growthProgress = Math.max(0, growthCounter - startThreshold);
  const twigGrowthSteps = Math.ceil(twigGrowSteps * (trunkGrowSteps / (totalTwigs * twigGrowSteps)));
  
  // Scale from 0 to 1 over twigGrowSteps
  const scale = Math.min(1, growthProgress / twigGrowSteps);
  return Math.max(0, Math.min(1, scale));
}

/**
 * Round a number to specified decimal places
 */
export function round(value: number, digits: number = 6): number {
  return Number(value.toFixed(digits));
}

