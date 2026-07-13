import type { Game, Task, Team } from './types';

export const DEFAULT_GAME_ID = 'human-haunt-2026';

export const defaultGame: Game = {
  id: DEFAULT_GAME_ID,
  name: 'Human Haunt',
  createdAt: 0,
};

export const defaultTeams: Team[] = [
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
];

export const defaultTasks: Task[] = [
  {
    id: 'task-biff-lime',
    gameId: DEFAULT_GAME_ID,
    title: 'Someone Biff it on a Lime',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'task-tiny-pizza-car',
    gameId: DEFAULT_GAME_ID,
    title: 'Tiny Pizza Car',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'task-norfolk-mermaid',
    gameId: DEFAULT_GAME_ID,
    title: 'Norfolk Mermaid',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'task-mowhawk',
    gameId: DEFAULT_GAME_ID,
    title: 'A mowhawk',
    sortOrder: 4,
    active: true,
  },
  {
    id: 'task-dog-stroller',
    gameId: DEFAULT_GAME_ID,
    title: 'Dog in stroller',
    sortOrder: 5,
    active: true,
  },
];
