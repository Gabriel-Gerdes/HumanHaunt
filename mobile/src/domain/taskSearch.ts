import type { Task } from './types';

/**
 * Filters tasks by a case-insensitive substring match against title text.
 * An empty/whitespace query returns the original list unchanged.
 */
export function filterTasksByTitleQuery<T extends Pick<Task, 'title'>>(
  tasks: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return tasks;
  }

  return tasks.filter(task => task.title.toLowerCase().includes(normalized));
}
