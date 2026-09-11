/** Helpers for the rewards hub (places, online). */

import {
  HUB_SCROLL_LIMIT,
  parseTaskLocation,
  type PlaceSummary,
} from './taskHubUtils';

export type RewardWithLocation = {
  id: string;
  title?: string;
  pointsCost?: number;
  rewardType?: string;
  thumbnail_url?: string;
  location?: unknown;
  location_id?: string;
};

export function parseRewardLocation(reward: RewardWithLocation) {
  return parseTaskLocation(reward);
}

export function isRewardOnline(reward: RewardWithLocation): boolean {
  const loc = parseRewardLocation(reward);
  return loc?.is_online === true;
}

/** Non-online reward tied to a physical place. */
export function isPhysicalPlaceReward(reward: RewardWithLocation): boolean {
  const loc = parseRewardLocation(reward);
  if (!loc || loc.is_online) return false;
  return true;
}

export function getUniqueRewardPlaces(
  rewards: RewardWithLocation[] | null | undefined
): PlaceSummary[] {
  if (!Array.isArray(rewards)) return [];

  const map = new Map<string, PlaceSummary>();
  for (const reward of rewards) {
    const loc = parseRewardLocation(reward);
    if (!loc || loc.is_online) continue;

    const existing = map.get(loc.id);
    if (existing) {
      existing.taskCount += 1;
    } else {
      map.set(loc.id, { id: loc.id, name: loc.name, taskCount: 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export function getOnlineRewards<T extends RewardWithLocation>(
  rewards: T[] | null | undefined
): T[] {
  if (!Array.isArray(rewards)) return [];
  return rewards.filter(isRewardOnline);
}

export { HUB_SCROLL_LIMIT };
