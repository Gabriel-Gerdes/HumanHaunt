import { buildTaskViews } from '../src/domain/claimResolution';
import { mapTaskRow } from '../src/db/mappers';
import { defaultTasks, DEFAULT_GAME_ID } from '../src/domain/seed';
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

function team(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-1',
    gameId: DEFAULT_GAME_ID,
    name: 'Team 1',
    color: '#000000',
    sortOrder: 1,
    ...overrides,
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

describe('seed task points', () => {
  test('every seeded task has positive base and current points', () => {
    expect(defaultTasks.length).toBeGreaterThan(0);

    for (const seeded of defaultTasks) {
      expect(seeded.basePoints).toBeGreaterThan(0);
      expect(seeded.currentPoints).toBe(seeded.basePoints);
      expect(seeded.pointsVisible).toBe(true);
    }
  });

  test('seeded tasks use distinct ids and expected point values', () => {
    const byId = new Map(defaultTasks.map(item => [item.id, item]));

    expect(byId.get('task-biff-lime')?.basePoints).toBe(10);
    expect(byId.get('task-tiny-pizza-car')?.basePoints).toBe(15);
    expect(byId.get('task-norfolk-mermaid')?.basePoints).toBe(20);
    expect(byId.get('task-mowhawk')?.basePoints).toBe(10);
    expect(byId.get('task-dog-stroller')?.basePoints).toBe(25);
    expect(new Set(defaultTasks.map(item => item.id)).size).toBe(
      defaultTasks.length,
    );
  });
});

describe('mapTaskRow', () => {
  test('maps sqlite integers into domain point fields', () => {
    const mapped = mapTaskRow({
      id: 'task-a',
      game_id: DEFAULT_GAME_ID,
      category_id: 'category-photo',
      title: 'Photo Booth',
      sort_order: 3,
      active: 1,
      base_points: 10,
      current_points: 15,
      points_visible: 1,
    });

    expect(mapped).toEqual({
      id: 'task-a',
      gameId: DEFAULT_GAME_ID,
      categoryId: 'category-photo',
      title: 'Photo Booth',
      sortOrder: 3,
      active: true,
      basePoints: 10,
      currentPoints: 15,
      pointsVisible: true,
    });
  });

  test('treats zero flags as inactive and points hidden', () => {
    const mapped = mapTaskRow({
      id: 'task-b',
      game_id: DEFAULT_GAME_ID,
      category_id: 'category-photo',
      title: 'Hidden Task',
      sort_order: 1,
      active: 0,
      base_points: 5,
      current_points: 5,
      points_visible: 0,
    });

    expect(mapped.active).toBe(false);
    expect(mapped.pointsVisible).toBe(false);
  });
});

describe('buildTaskViews with points', () => {
  test('preserves point fields when there is no winner', () => {
    const [view] = buildTaskViews(
      [task({ currentPoints: 15, pointsVisible: false })],
      [team()],
      [],
    );

    expect(view.basePoints).toBe(10);
    expect(view.currentPoints).toBe(15);
    expect(view.pointsVisible).toBe(false);
    expect(view.winningClaim).toBeUndefined();
    expect(view.claimCount).toBe(0);
  });

  test('preserves point fields when a claim wins the task', () => {
    const [view] = buildTaskViews(
      [task({ basePoints: 20, currentPoints: 25 })],
      [team()],
      [claim()],
    );

    expect(view.winningTeam?.id).toBe('team-1');
    expect(view.basePoints).toBe(20);
    expect(view.currentPoints).toBe(25);
    expect(view.claimCount).toBe(1);
  });

  test('keeps per-task points independent across the list', () => {
    const views = buildTaskViews(
      [
        task({ id: 'task-a', basePoints: 10, currentPoints: 10 }),
        task({
          id: 'task-b',
          title: 'Other',
          sortOrder: 2,
          basePoints: 30,
          currentPoints: 40,
          pointsVisible: false,
        }),
      ],
      [team()],
      [claim({ taskId: 'task-b', teamId: 'team-1' })],
    );

    expect(views[0].currentPoints).toBe(10);
    expect(views[0].winningClaim).toBeUndefined();
    expect(views[1].currentPoints).toBe(40);
    expect(views[1].pointsVisible).toBe(false);
    expect(views[1].winningTeam?.id).toBe('team-1');
  });
});
