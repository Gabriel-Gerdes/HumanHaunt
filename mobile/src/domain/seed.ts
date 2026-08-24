import type { Game, Task, TaskCategory, Team } from './types';

export const DEFAULT_GAME_ID = 'human-haunt-2026';
export const COMPLETED_CATEGORY_ID = 'category-completed';

/**
 * Recursively freezes a value (and every nested object/array) so exported
 * seed data cannot be mutated at runtime.
 */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

export const defaultGame: Game = deepFreeze({
  id: DEFAULT_GAME_ID,
  name: 'Human Haunt',
  createdAt: 0,
});

export const defaultTeams: Team[] = deepFreeze([
  {
    id: 'team-1',
    gameId: DEFAULT_GAME_ID,
    name: 'Team 1',
    color: '#2563eb',
    sortOrder: 1,
  },
  {
    id: 'team-2',
    gameId: DEFAULT_GAME_ID,
    name: 'Team 2',
    color: '#dc2626',
    sortOrder: 2,
  },
  {
    id: 'team-3',
    gameId: DEFAULT_GAME_ID,
    name: 'Team 3',
    color: '#16a34a',
    sortOrder: 3,
  },
]);

export const defaultCategories: TaskCategory[] = deepFreeze([
  {
    id: 'category-photo',
    gameId: DEFAULT_GAME_ID,
    name: 'Photo',
    sortOrder: 1,
    color: '#7c3aed',
    active: true,
    isSystem: false,
  },
  {
    id: 'category-location',
    gameId: DEFAULT_GAME_ID,
    name: 'Location',
    sortOrder: 2,
    color: '#0891b2',
    active: true,
    isSystem: false,
  },
  {
    id: 'category-social',
    gameId: DEFAULT_GAME_ID,
    name: 'Social',
    sortOrder: 3,
    color: '#ea580c',
    active: true,
    isSystem: false,
  },
  {
    id: COMPLETED_CATEGORY_ID,
    gameId: DEFAULT_GAME_ID,
    name: 'Completed',
    sortOrder: 100,
    color: '#64748b',
    active: true,
    isSystem: true,
  },
]);

export const defaultTasks: Task[] = deepFreeze([
  {
    id: 'task-biff-lime',
    gameId: DEFAULT_GAME_ID,
    categoryId: 'category-social',
    title: 'Someone Biff it on a Lime',
    sortOrder: 1,
    active: true,
    basePoints: 10,
    currentPoints: 10,
    pointsVisible: true,
  },
  {
    id: 'task-tiny-pizza-car',
    gameId: DEFAULT_GAME_ID,
    categoryId: 'category-location',
    title: 'Tiny Pizza Car',
    sortOrder: 2,
    active: true,
    basePoints: 15,
    currentPoints: 15,
    pointsVisible: true,
  },
  {
    id: 'task-norfolk-mermaid',
    gameId: DEFAULT_GAME_ID,
    categoryId: 'category-location',
    title: 'Norfolk Mermaid',
    sortOrder: 3,
    active: true,
    basePoints: 20,
    currentPoints: 20,
    pointsVisible: true,
  },
  {
    id: 'task-mowhawk',
    gameId: DEFAULT_GAME_ID,
    categoryId: 'category-photo',
    title: 'A mowhawk',
    sortOrder: 4,
    active: true,
    basePoints: 10,
    currentPoints: 10,
    pointsVisible: true,
  },
  {
    id: 'task-dog-stroller',
    gameId: DEFAULT_GAME_ID,
    categoryId: 'category-photo',
    title: 'Dog in stroller',
    sortOrder: 5,
    active: true,
    basePoints: 25,
    currentPoints: 25,
    pointsVisible: true,
  },
]);
