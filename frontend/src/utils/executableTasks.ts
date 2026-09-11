/** Tasks the user can still complete on the home screen ("Nächste Aufgaben"). */

import { isTaskNearby, isTaskOnline } from './taskHubUtils';

export type ExecutableTask = {
  id: string;
  title?: string;
  points?: number;
  thumbnail_url?: string;
  type?: string;
  location?: unknown;
  location_id?: string;
  target_latitude?: number | null;
  target_longitude?: number | null;
  completed?: boolean;
  is_available?: boolean;
  verification_status?: string;
};

export type FilterExecutableTasksOptions = {
  userLocation?: { lat: number; lng: number } | null;
};

export function filterExecutableTasks(
  tasks: ExecutableTask[] | null | undefined,
  options?: FilterExecutableTasksOptions
): ExecutableTask[] {
  if (!Array.isArray(tasks)) return [];

  const userLocation = options?.userLocation ?? null;

  return tasks.filter((task) => {
    if (task.completed) return false;
    if (task.is_available === false) return false;
    if (task.verification_status === 'pending') return false;

    if (isTaskOnline(task)) return true;

    if (!userLocation) return false;

    return isTaskNearby(task, userLocation);
  });
}
