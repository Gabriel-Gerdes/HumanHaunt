import { buildTaskViews } from '../src/domain/claimResolution';
import { defaultTasks } from '../src/domain/seed';
import type { Task, Team } from '../src/domain/types';

test('seed tasks include base, current, and visibility point fields', () => {
  expect(defaultTasks.length).toBeGreaterThan(0);

  for (const task of defaultTasks) {
    expect(task.basePoints).toBeGreaterThan(0);
    expect(task.currentPoints).toBe(task.basePoints);
    expect(task.pointsVisible).toBe(true);
  }
});

test('buildTaskViews preserves task point fields on the derived view', () => {
  const tasks: Task[] = [
    {
      id: 'task-a',
      gameId: 'game',
      title: 'Photo Booth',
      sortOrder: 1,
      active: true,
      basePoints: 10,
      currentPoints: 15,
      pointsVisible: false,
    },
  ];
  const teams: Team[] = [
    {
      id: 'team-1',
      gameId: 'game',
      name: 'Team 1',
      color: '#000000',
      sortOrder: 1,
    },
  ];

  const [view] = buildTaskViews(tasks, teams, []);

  expect(view.basePoints).toBe(10);
  expect(view.currentPoints).toBe(15);
  expect(view.pointsVisible).toBe(false);
});
