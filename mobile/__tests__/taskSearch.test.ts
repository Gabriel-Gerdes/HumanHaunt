import type { Task } from './types';

/**
 * Filters tasks by a case-insensitive substring match against title text.
 * An empty/whitespace query returns the original list unchanged.
 *
 * The query is always treated as LITERAL text: regex metacharacters such as
 * ( ) * + ? . ^ $ | [ ] { } \ are matched verbatim and never interpreted as
 * RegExp syntax, so arbitrary user input can never trigger a RegExp
 * SyntaxError. Implemented with String.prototype.includes over lowercased
 * values instead of constructing a RegExp from raw user input.
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
