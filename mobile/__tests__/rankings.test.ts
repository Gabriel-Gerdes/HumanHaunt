import { buildTaskViews } from '../src/domain/claimResolution';
import { buildTeamStandings } from '../src/domain/rankings';
import { defaultTeams, DEFAULT_GAME_ID } from '../src/domain/seed';
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

function standingsFor(tasks: Task[], claims: ClaimEvent[], teams: Team[] = defaultTeams) {
  const views = buildTaskViews(tasks, teams, claims);
  return buildTeamStandings(teams, views);
}

describe('buildTeamStandings', () => {
  test('gives every team zero when there are no claims', () => {
    const standings = standingsFor(
      [task(), task({ id: 'task-b', sortOrder: 2, currentPoints: 20 })],
      [],
    );

    expect(standings).toHaveLength(3);
    expect(standings.every(entry => entry.score === 0)).toBe(true);
    expect(standings.every(entry => entry.rank === 1)).toBe(true);
    expect(standings.map(entry => entry.team.name)).toEqual([
      'Team 1',
      'Team 2',
      'Team 3',
    ]);
  });

  test('sums currentPoints only for winning claims', () => {
    const standings = standingsFor(
      [
        task({ id: 'task-a', currentPoints: 10 }),
        task({ id: 'task-b', sortOrder: 2, currentPoints: 25 }),
        task({ id: 'task-c', sortOrder: 3, currentPoints: 15 }),
      ],
      [
        claim({ id: 'claim-a', taskId: 'task-a', teamId: 'team-1', claimedAt: 100 }),
        claim({ id: 'claim-b', taskId: 'task-b', teamId: 'team-2', claimedAt: 110 }),
        claim({
          id: 'claim-c-late',
          taskId: 'task-c',
          teamId: 'team-1',
          claimedAt: 200,
        }),
        claim({
          id: 'claim-c-early',
          taskId: 'task-c',
          teamId: 'team-3',
          claimedAt: 150,
        }),
      ],
    );

    const byId = new Map(standings.map(entry => [entry.team.id, entry]));

    expect(byId.get('team-1')?.score).toBe(10);
    expect(byId.get('team-2')?.score).toBe(25);
    expect(byId.get('team-3')?.score).toBe(15);
    expect(standings[0].team.id).toBe('team-2');
    expect(standings[0].rank).toBe(1);
    expect(standings[1].team.id).toBe('team-3');
    expect(standings[1].rank).toBe(2);
    expect(standings[2].team.id).toBe('team-1');
    expect(standings[2].rank).toBe(3);
  });

  test('assigns shared ranks when scores are tied', () => {
    const standings = standingsFor(
      [
        task({ id: 'task-a', currentPoints: 20 }),
        task({ id: 'task-b', sortOrder: 2, currentPoints: 20 }),
        task({ id: 'task-c', sortOrder: 3, currentPoints: 5 }),
      ],
      [
        claim({ id: 'claim-a', taskId: 'task-a', teamId: 'team-1' }),
        claim({ id: 'claim-b', taskId: 'task-b', teamId: 'team-2' }),
        claim({ id: 'claim-c', taskId: 'task-c', teamId: 'team-3' }),
      ],
    );

    expect(standings[0].score).toBe(20);
    expect(standings[1].score).toBe(20);
    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(1);
    expect(standings[2].score).toBe(5);
    expect(standings[2].rank).toBe(3);
  });

  test('tracks claimed task counts per team', () => {
    const standings = standingsFor(
      [
        task({ id: 'task-a', currentPoints: 10 }),
        task({ id: 'task-b', sortOrder: 2, currentPoints: 10 }),
      ],
      [
        claim({ id: 'claim-a', taskId: 'task-a', teamId: 'team-1' }),
        claim({ id: 'claim-b', taskId: 'task-b', teamId: 'team-1' }),
      ],
    );

    const team1 = standings.find(entry => entry.team.id === 'team-1');
    expect(team1?.claimedTaskCount).toBe(2);
    expect(team1?.score).toBe(20);
  });
});
