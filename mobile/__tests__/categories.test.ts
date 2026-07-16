import { buildTaskViews } from '../src/domain/claimResolution';
import {
  groupTasksByCategory,
  tasksForCategory,
} from '../src/domain/categories';
import {
  COMPLETED_CATEGORY_ID,
  defaultCategories,
  DEFAULT_GAME_ID,
} from '../src/domain/seed';
import type { ClaimEvent, Task, Team } from '../src/domain/types';

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

function team(): Team {
  return {
    id: 'team-1',
    gameId: DEFAULT_GAME_ID,
    name: 'Team 1',
    color: '#000000',
    sortOrder: 1,
  };
}

function claim(overrides: Partial<ClaimEvent> = {}): ClaimEvent {
  return {
    id: 'claim-1',
    gameId: DEFAULT_GAME_ID,
    taskId: 'task-a',
    teamId: 'team-1',
    deviceId: 'device-1',
    claimedAt: 100,
    createdAt: 100,
    receivedAt: 100,
    source: 'local',
    ...overrides,
  };
}

describe('groupTasksByCategory', () => {
  test('keeps open tasks in their package category', () => {
    const views = buildTaskViews(
      [
        task({ id: 'task-photo', categoryId: 'category-photo' }),
        task({
          id: 'task-location',
          categoryId: 'category-location',
          sortOrder: 2,
        }),
      ],
      [team()],
      [],
    );

    const sections = groupTasksByCategory(defaultCategories, views);
    const photo = sections.find(section => section.category.id === 'category-photo');
    const location = sections.find(
      section => section.category.id === 'category-location',
    );
    const completed = sections.find(
      section => section.category.id === COMPLETED_CATEGORY_ID,
    );

    expect(photo?.tasks.map(item => item.id)).toEqual(['task-photo']);
    expect(location?.tasks.map(item => item.id)).toEqual(['task-location']);
    expect(completed?.tasks).toHaveLength(0);
  });

  test('moves claimed tasks into the Completed category', () => {
    const views = buildTaskViews(
      [
        task({ id: 'task-open', categoryId: 'category-photo' }),
        task({
          id: 'task-claimed',
          categoryId: 'category-photo',
          sortOrder: 2,
        }),
      ],
      [team()],
      [claim({ taskId: 'task-claimed' })],
    );

    const sections = groupTasksByCategory(defaultCategories, views);
    const photo = sections.find(section => section.category.id === 'category-photo');
    const completed = sections.find(
      section => section.category.id === COMPLETED_CATEGORY_ID,
    );

    expect(photo?.tasks.map(item => item.id)).toEqual(['task-open']);
    expect(completed?.tasks.map(item => item.id)).toEqual(['task-claimed']);
    expect(completed?.tasks[0].winningClaim).toBeDefined();
  });

  test('tasksForCategory returns only the selected section', () => {
    const views = buildTaskViews(
      [
        task({ id: 'task-open', categoryId: 'category-social' }),
        task({
          id: 'task-claimed',
          categoryId: 'category-social',
          sortOrder: 2,
        }),
      ],
      [team()],
      [claim({ taskId: 'task-claimed' })],
    );

    expect(
      tasksForCategory(defaultCategories, views, 'category-social').map(
        item => item.id,
      ),
    ).toEqual(['task-open']);
    expect(
      tasksForCategory(defaultCategories, views, COMPLETED_CATEGORY_ID).map(
        item => item.id,
      ),
    ).toEqual(['task-claimed']);
  });
});

describe('seed categories', () => {
  test('includes a system Completed category and package categories', () => {
    expect(defaultCategories.some(category => category.isSystem)).toBe(true);
    expect(
      defaultCategories.find(category => category.id === COMPLETED_CATEGORY_ID)
        ?.name,
    ).toBe('Completed');
    expect(defaultCategories.filter(category => !category.isSystem).length).toBeGreaterThan(0);
  });
});
