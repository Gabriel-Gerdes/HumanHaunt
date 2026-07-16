import { filterTasksByTitleQuery } from '../src/domain/taskSearch';
import { DEFAULT_GAME_ID } from '../src/domain/seed';
import type { Task } from '../src/domain/types';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-a',
    gameId: DEFAULT_GAME_ID,
    categoryId: 'category-photo',
    title: 'Photo Booth',
    sortOrder: 1,
    active: true,
    basePoints: 10,
    currentPoints: 10,
    pointsVisible: true,
    ...overrides,
  };
}

const tasks = [
  task({ id: 'task-photo', title: 'Photo Booth' }),
  task({ id: 'task-mermaid', title: 'Norfolk Mermaid', sortOrder: 2 }),
  task({ id: 'task-pizza', title: 'Tiny Pizza Car', sortOrder: 3 }),
];

describe('filterTasksByTitleQuery', () => {
  test('returns all tasks when the query is empty or whitespace', () => {
    expect(filterTasksByTitleQuery(tasks, '')).toEqual(tasks);
    expect(filterTasksByTitleQuery(tasks, '   ')).toEqual(tasks);
  });

  test('matches titles case-insensitively by substring', () => {
    expect(filterTasksByTitleQuery(tasks, 'photo').map(item => item.id)).toEqual([
      'task-photo',
    ]);
    expect(filterTasksByTitleQuery(tasks, 'MERMAID').map(item => item.id)).toEqual([
      'task-mermaid',
    ]);
    expect(filterTasksByTitleQuery(tasks, 'pi').map(item => item.id)).toEqual([
      'task-pizza',
    ]);
  });

  test('returns an empty list when nothing matches', () => {
    expect(filterTasksByTitleQuery(tasks, 'dragon')).toEqual([]);
  });
});
