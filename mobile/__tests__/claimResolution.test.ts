import {
  buildTaskViews,
  compareClaimEvents,
  dedupeClaimEventsById,
  getClaimsForTask,
  getWinningClaim,
} from '../src/domain/claimResolution';
import { DEFAULT_GAME_ID } from '../src/domain/seed';
import type { ClaimEvent, Task, Team } from '../src/domain/types';

function claim(overrides: Partial<ClaimEvent> = {}): ClaimEvent {
  return {
    id: 'claim-default',
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

/** Plain-JSON deep clone used to snapshot inputs for immutability checks. */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

describe('compareClaimEvents', () => {
  test('orders by claimedAt ascending', () => {
    const earlier = claim({ id: 'claim-b', claimedAt: 50 });
    const later = claim({ id: 'claim-a', claimedAt: 100 });

    expect(compareClaimEvents(earlier, later)).toBeLessThan(0);
    expect(compareClaimEvents(later, earlier)).toBeGreaterThan(0);
  });

  test('uses lexicographic event id when claimedAt ties', () => {
    const a = claim({ id: 'claim-a', claimedAt: 100 });
    const b = claim({ id: 'claim-b', claimedAt: 100 });

    expect(compareClaimEvents(a, b)).toBeLessThan(0);
    expect(compareClaimEvents(b, a)).toBeGreaterThan(0);
  });
});

describe('dedupeClaimEventsById', () => {
  test('keeps only the first occurrence of each event id', () => {
    const unique = dedupeClaimEventsById([
      claim({ id: 'claim-1', teamId: 'team-1', claimedAt: 100 }),
      claim({ id: 'claim-1', teamId: 'team-2', claimedAt: 50 }),
      claim({ id: 'claim-2', teamId: 'team-3', claimedAt: 120 }),
    ]);

    expect(unique).toHaveLength(2);
    expect(unique.find(event => event.id === 'claim-1')?.teamId).toBe('team-1');
    expect(unique.map(event => event.id)).toEqual(['claim-1', 'claim-2']);
  });
});

describe('getWinningClaim', () => {
  test('selects the earliest claim as the task winner', () => {
    const winner = getWinningClaim([
      claim({ id: 'claim-late', teamId: 'team-2', claimedAt: 200 }),
      claim({ id: 'claim-early', teamId: 'team-1', claimedAt: 100 }),
    ]);

    expect(winner?.id).toBe('claim-early');
  });

  test('breaks same-timestamp claim ties by event id', () => {
    const winner = getWinningClaim([
      claim({ id: 'claim-b', teamId: 'team-2', claimedAt: 100 }),
      claim({ id: 'claim-a', teamId: 'team-1', claimedAt: 100 }),
    ]);

    expect(winner?.id).toBe('claim-a');
  });

  test('returns no winner when a task has no claims', () => {
    expect(getWinningClaim([])).toBeUndefined();
  });

  test('ignores duplicate event ids when choosing a winner', () => {
    const winner = getWinningClaim([
      claim({ id: 'claim-dup', teamId: 'team-1', claimedAt: 100 }),
      claim({ id: 'claim-dup', teamId: 'team-2', claimedAt: 1 }),
      claim({ id: 'claim-other', teamId: 'team-3', claimedAt: 50 }),
    ]);

    // First occurrence of claim-dup is kept (claimedAt 100), so claim-other wins.
    expect(winner?.id).toBe('claim-other');
  });

  test('keeps multiple distinct conflicting claims while deriving one winner', () => {
    const events = [
      claim({ id: 'claim-100', teamId: 'team-1', claimedAt: 100 }),
      claim({ id: 'claim-200', teamId: 'team-2', claimedAt: 200 }),
    ];

    expect(getWinningClaim(events)?.id).toBe('claim-100');
    expect(dedupeClaimEventsById(events)).toHaveLength(2);
  });
});

describe('getClaimsForTask', () => {
  test('filters to one task and dedupes by event id', () => {
    const claims = getClaimsForTask(
      [
        claim({ id: 'claim-a', taskId: 'task-a', claimedAt: 100 }),
        claim({ id: 'claim-a', taskId: 'task-a', claimedAt: 1 }),
        claim({ id: 'claim-b', taskId: 'task-b', claimedAt: 50 }),
        claim({ id: 'claim-c', taskId: 'task-a', claimedAt: 150 }),
      ],
      'task-a',
    );

    // NOTE: getClaimsForTask makes no ordering guarantee (insertion order of
    // first occurrences is an implementation detail), so ids are sorted here
    // instead of asserting a positional contract.
    expect(claims.map(event => event.id).sort()).toEqual(['claim-a', 'claim-c']);
  });
});

describe('buildTaskViews', () => {
  const teams = [
    team({ id: 'team-1', name: 'Team 1' }),
    team({ id: 'team-2', name: 'Team 2', sortOrder: 2 }),
  ];

  test('derives a single winner while preserving multi-claim count', () => {
    const [view] = buildTaskViews(
      [task()],
      teams,
      [
        claim({ id: 'claim-late', teamId: 'team-2', claimedAt: 200 }),
        claim({ id: 'claim-early', teamId: 'team-1', claimedAt: 100 }),
      ],
    );

    expect(view.winningClaim?.id).toBe('claim-early');
    expect(view.winningTeam?.id).toBe('team-1');
    expect(view.claimCount).toBe(2);
  });

  test('does not count duplicate event ids toward claimCount', () => {
    const [view] = buildTaskViews(
      [task()],
      teams,
      [
        claim({ id: 'claim-1', teamId: 'team-1', claimedAt: 100 }),
        claim({ id: 'claim-1', teamId: 'team-2', claimedAt: 50 }),
      ],
    );

    expect(view.claimCount).toBe(1);
    expect(view.winningClaim?.teamId).toBe('team-1');
  });

  test('leaves open tasks without a winner', () => {
    const [view] = buildTaskViews([task()], teams, []);

    expect(view.winningClaim).toBeUndefined();
    expect(view.winningTeam).toBeUndefined();
    expect(view.claimCount).toBe(0);
  });

  test('resolves already-claimed semantics from an existing winner', () => {
    const [view] = buildTaskViews(
      [task()],
      teams,
      [claim({ id: 'claim-existing', teamId: 'team-2', claimedAt: 10 })],
    );

    expect(view.winningClaim?.id).toBe('claim-existing');
    expect(view.winningClaim?.teamId).toBe('team-2');
    expect(view.winningClaim?.claimedAt).toBe(10);
    expect(view.winningTeam?.id).toBe('team-2');
    expect(view.claimCount).toBe(1);
  });
});

describe('buildTaskViews ordering, isolation and resilience', () => {
  const teams = [
    team({ id: 'team-1', name: 'Team 1' }),
    team({ id: 'team-2', name: 'Team 2', sortOrder: 2 }),
  ];

  test('orders views by task sortOrder regardless of input order', () => {
    const lateTask = task({ id: 'task-b', title: 'Trivia Night', sortOrder: 2 });

    const views = buildTaskViews(
      // Deliberately supplied out of sortOrder order.
      [lateTask, task()],
      teams,
      [
        claim({ id: 'claim-b-only', taskId: 'task-b', teamId: 'team-2', claimedAt: 300 }),
        claim({ id: 'claim-a-second', teamId: 'team-2', claimedAt: 200 }),
        claim({ id: 'claim-a-first', teamId: 'team-1', claimedAt: 100 }),
      ],
    );
    const [firstView, secondView] = views;

    expect(views.map(view => view.id)).toEqual(['task-a', 'task-b']);
    expect(firstView.winningClaim?.id).toBe('claim-a-first');
    expect(firstView.winningTeam?.id).toBe('team-1');
    expect(firstView.claimCount).toBe(2);
    expect(secondView.winningClaim?.id).toBe('claim-b-only');
    expect(secondView.winningTeam?.id).toBe('team-2');
    expect(secondView.claimCount).toBe(1);
  });

  test('falls back gracefully when the winning claim references an unknown team', () => {
    const [view] = buildTaskViews(
      [task()],
      teams,
      [claim({ id: 'claim-ghost', teamId: 'team-ghost', claimedAt: 100 })],
    );

    expect(view.winningClaim?.id).toBe('claim-ghost');
    expect(view.winningTeam).toBeUndefined();
    expect(view.claimCount).toBe(1);
  });

  test('excludes claims that belong to a different game', () => {
    const [view] = buildTaskViews(
      [task()],
      teams,
      [
        claim({ id: 'claim-other-game', gameId: 'game-other', claimedAt: 1 }),
        claim({ id: 'claim-this-game', claimedAt: 100 }),
      ],
    );

    expect(view.claimCount).toBe(1);
    expect(view.winningClaim?.id).toBe('claim-this-game');
    expect(view.winningTeam?.id).toBe('team-1');
  });

  test('does not mutate the tasks or claim events passed in', () => {
    const tasks = [task(), task({ id: 'task-b', sortOrder: 2 })];
    const claimEvents = [
      claim({ id: 'claim-late', teamId: 'team-2', claimedAt: 200 }),
      claim({ id: 'claim-early', teamId: 'team-1', claimedAt: 100 }),
    ];
    const tasksSnapshot = deepClone(tasks);
    const claimsSnapshot = deepClone(claimEvents);

    buildTaskViews(tasks, teams, claimEvents);

    expect(tasks).toEqual(tasksSnapshot);
    expect(claimEvents).toEqual(claimsSnapshot);
  });
});

describe('domain helpers do not mutate their inputs', () => {
  test('compareClaimEvents, dedupe, getClaimsForTask and getWinningClaim leave inputs intact', () => {
    const events = [
      claim({ id: 'claim-b', claimedAt: 50 }),
      claim({ id: 'claim-a', claimedAt: 100 }),
      claim({ id: 'claim-c', taskId: 'task-z', claimedAt: 20 }),
    ];
    const snapshot = deepClone(events);
    const [first, second] = events;

    compareClaimEvents(first, second);
    dedupeClaimEventsById(events);
    getClaimsForTask(events, 'task-a');
    getWinningClaim(events);

    expect(events).toEqual(snapshot);
  });
});

describe('adversarial and malformed inputs', () => {
  const teams = [team()];

  test('handles empty-string and oversized event ids deterministically', () => {
    const oversizedId = 'x'.repeat(10_000);
    const events = [
      claim({ id: '', claimedAt: 100 }),
      claim({ id: oversizedId, claimedAt: 100 }),
    ];

    expect(() => getWinningClaim(events)).not.toThrow();
    // claimedAt tie falls back to lexicographic id comparison; '' sorts first.
    expect(getWinningClaim(events)?.id).toBe('');
  });

  test('tolerates tampered and extreme timestamps without crashing', () => {
    const events = [
      claim({ id: 'claim-negative', claimedAt: -1 }),
      claim({ id: 'claim-min', claimedAt: Number.MIN_SAFE_INTEGER }),
      claim({ id: 'claim-max', claimedAt: Number.MAX_SAFE_INTEGER }),
    ];

    expect(() => getWinningClaim(events)).not.toThrow();
    expect(getWinningClaim(events)?.id).toBe('claim-min');
  });

  test('duplicate ids across games and tasks still dedupe to the first occurrence', () => {
    const events = [
      claim({ id: 'claim-dup', taskId: 'task-a', claimedAt: 100 }),
      claim({ id: 'claim-dup', taskId: 'task-b', gameId: 'game-other', claimedAt: 1 }),
    ];

    expect(dedupeClaimEventsById(events)).toHaveLength(1);
    expect(getClaimsForTask(events, 'task-a')).toHaveLength(1);
  });

  test('claims pointing at unknown tasks or teams never crash view building', () => {
    const events = [
      claim({ id: 'claim-orphan-task', taskId: 'task-missing', claimedAt: 5 }),
      claim({ id: 'claim-ghost-team', teamId: 'team-ghost', claimedAt: 7 }),
    ];

    expect(() => buildTaskViews([task()], teams, events)).not.toThrow();

    const [view] = buildTaskViews([task()], teams, events);
    expect(view.winningClaim?.id).toBe('claim-ghost-team');
    expect(view.winningTeam).toBeUndefined();
    expect(view.claimCount).toBe(1);
  });
});
