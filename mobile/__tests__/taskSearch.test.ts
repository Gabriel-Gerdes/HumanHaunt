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

// ---------------------------------------------------------------------------
// Tests (added for feedback #409)
// ---------------------------------------------------------------------------

interface TestTask extends Pick<Task, 'title'> {
  id: number;
}

function makeTask(id: number, title: string): TestTask {
  return { id, title };
}

describe('filterTasksByTitleQuery', () => {
  const tasks: TestTask[] = [
    makeTask(1, 'Clean the attic'),
    makeTask(2, 'Water the plants'),
    makeTask(3, 'CLEAN the garage'),
    makeTask(4, 'Repair fence'),
  ];

  it('returns all tasks unchanged when the query is empty', () => {
    expect(filterTasksByTitleQuery(tasks, '')).toEqual(tasks);
  });

  it('returns all tasks unchanged when the query is whitespace-only', () => {
    expect(filterTasksByTitleQuery(tasks, '   \t\n  ')).toEqual(tasks);
  });

  it('matches titles case-insensitively', () => {
    const result = filterTasksByTitleQuery(tasks, 'cLeAn');
    expect(result).toEqual([tasks[0], tasks[2]]);
  });

  it('treats regex metacharacters as literal text and never throws', () => {
    const literalTasks: TestTask[] = [
      makeTask(1, 'a(b)c'),
      makeTask(2, 'plain'),
    ];

    expect(() => filterTasksByTitleQuery(literalTasks, '(*)')).not.toThrow();
    expect(filterTasksByTitleQuery(literalTasks, '(*)')).toEqual([]);
    expect(filterTasksByTitleQuery(literalTasks, 'a(b)c')).toEqual([
      literalTasks[0],
    ]);
  });

  it('returns an empty array when no title matches the query', () => {
    expect(filterTasksByTitleQuery(tasks, 'zzz-no-such-title')).toEqual([]);
  });

  it('preserves original input order across multiple matches', () => {
    const ordered: TestTask[] = [
      makeTask(1, 'alpha beta'),
      makeTask(2, 'gamma'),
      makeTask(3, 'beta gamma'),
    ];

    const result = filterTasksByTitleQuery(ordered, 'BETA');
    expect(result.map(task => task.title)).toEqual(['alpha beta', 'beta gamma']);
  });
});
