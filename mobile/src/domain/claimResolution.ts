import type { ClaimEvent, Task, TaskWithWinner, Team } from './types';

/**
 * First-claim-wins lockout rules:
 * 1. Duplicate event IDs are ignored (first occurrence kept).
 * 2. The winning claim is the earliest by `claimedAt`.
 * 3. If `claimedAt` ties, the byte-wise smaller event `id` wins.
 *
 * NOTE: a `(logicalSeq, claimedAt, eventId)` ordering is planned in
 * docs/design-doc-v1.md (Clock Discipline), but `ClaimEvent` does not carry
 * a `logicalSeq` field yet; that ordering must not ship until the payload,
 * type, and creation path all support it.
 *
 * Conflicting claims can all remain in the append-only log. Only the derived
 * winner is used for task lockout / scoring.
 */
export function compareClaimEvents(left: ClaimEvent, right: ClaimEvent) {
  if (left.claimedAt !== right.claimedAt) {
    return left.claimedAt - right.claimedAt;
  }

  // Byte-wise id comparison keeps ordering device-independent;
  // localeCompare is locale-sensitive and must not be used here.
  if (left.id < right.id) {
    return -1;
  }

  if (left.id > right.id) {
    return 1;
  }

  return 0;
}

/** Keeps the first occurrence of each claim event id. */
export function dedupeClaimEventsById(events: ClaimEvent[]): ClaimEvent[] {
  const byId = new Map<string, ClaimEvent>();

  for (const event of events) {
    if (!byId.has(event.id)) {
      byId.set(event.id, event);
    }
  }

  return [...byId.values()];
}

export function getClaimsForTask(events: ClaimEvent[], taskId: string) {
  return dedupeClaimEventsById(events.filter(event => event.taskId === taskId));
}

export function getWinningClaim(events: ClaimEvent[]) {
  const uniqueEvents = dedupeClaimEventsById(events);

  if (uniqueEvents.length === 0) {
    return undefined;
  }

  return [...uniqueEvents].sort(compareClaimEvents)[0];
}

export function buildTaskViews(
  tasks: Task[],
  teams: Team[],
  claimEvents: ClaimEvent[],
): TaskWithWinner[] {
  const teamById = new Map(teams.map(team => [team.id, team]));

  return tasks.map(task => {
    const taskClaims = getClaimsForTask(claimEvents, task.id);
    const winningClaim = getWinningClaim(taskClaims);

    return {
      ...task,
      winningClaim,
      winningTeam: winningClaim ? teamById.get(winningClaim.teamId) : undefined,
      claimCount: taskClaims.length,
    };
  });
}
