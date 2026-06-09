/** Tasks the user can still complete (same rules as TasksPage: not done, available). */

export type ExecutableTask = {
  id: string;
  title?: string;
  points?: number;
  thumbnail_url?: string;
  type?: string;
  completed?: boolean;
  is_available?: boolean;
  verification_status?: string;
};

export function filterExecutableTasks(tasks: ExecutableTask[] | null | undefined): ExecutableTask[] {
  if (!Array.isArray(tasks)) return [];

  const open = tasks.filter((task) => !task.completed && task.is_available !== false);

  open.sort((a, b) => {
    const aCompleted = !!a.completed;
    const bCompleted = !!b.completed;
    const aValidating = a.verification_status === 'pending';
    const bValidating = b.verification_status === 'pending';

    if (!aCompleted && bCompleted) return -1;
    if (aCompleted && !bCompleted) return 1;

    if (aCompleted && bCompleted) {
      if (aValidating && !bValidating) return -1;
      if (!aValidating && bValidating) return 1;
    }

    return 0;
  });

  return open;
}
