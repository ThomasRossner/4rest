/** Helpers for the tasks hub (places, online, collection). */

export type TaskWithLocation = {
  id: string;
  location?: unknown;
  location_id?: string;
};

export type ParsedTaskLocation = {
  id: string;
  name: string;
  is_online: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type PlaceSummary = {
  id: string;
  name: string;
  taskCount: number;
};

function coerceBool(value: unknown): boolean {
  return value === true || value === 'true' || String(value).toLowerCase() === 'true';
}

export function parseTaskLocation(task: TaskWithLocation): ParsedTaskLocation | null {
  if (!task?.location) return null;

  let raw = task.location;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!raw || typeof raw !== 'object') return null;

  const loc = raw as Record<string, unknown>;
  const id = String(loc.id ?? task.location_id ?? '');
  if (!id) return null;

  const lat = loc.latitude;
  const lng = loc.longitude;
  const latitude =
    lat == null ? null : typeof lat === 'string' ? parseFloat(lat) : Number(lat);
  const longitude =
    lng == null ? null : typeof lng === 'string' ? parseFloat(lng) : Number(lng);

  return {
    id,
    name: String(loc.name ?? id),
    is_online: coerceBool(loc.is_online),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

export function isTaskOnline(task: TaskWithLocation): boolean {
  const loc = parseTaskLocation(task);
  return loc?.is_online === true;
}

/** Physical place (non-online location with coordinates). */
export function isPhysicalPlaceTask(task: TaskWithLocation): boolean {
  const loc = parseTaskLocation(task);
  if (!loc || loc.is_online) return false;
  return loc.latitude != null && loc.longitude != null;
}

export function getUniquePlaces(tasks: TaskWithLocation[] | null | undefined): PlaceSummary[] {
  if (!Array.isArray(tasks)) return [];

  const map = new Map<string, PlaceSummary>();
  for (const task of tasks) {
    const loc = parseTaskLocation(task);
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

export function getOnlineTasks<T extends TaskWithLocation>(tasks: T[] | null | undefined): T[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(isTaskOnline);
}

/** Deterministic shuffle so hub tiles stay stable per session seed. */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickShuffledTasks<T>(tasks: T[], seed: string, limit: number): T[] {
  if (!tasks.length || limit <= 0) return [];
  const rng = mulberry32(hashSeed(seed));
  const copy = [...tasks];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, limit);
}

export const HUB_SCROLL_LIMIT = 10;
