import { getWinningClaim } from '../src/domain/claimResolution';
import type { ClaimEvent } from '../src/domain/types';

function claim(overrides: Partial<ClaimEvent>): ClaimEvent {
  return {
    id: 'claim-default',
    gameId: 'game',
    taskId: 'task',
    teamId: 'team-1',
    deviceId: 'device-1',
    claimedAt: 100,
    createdAt: 100,
    receivedAt: 100,
    source: 'local',
    ...overrides,
  };
}

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
