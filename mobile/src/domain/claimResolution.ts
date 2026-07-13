import type { ClaimEvent, Task, TaskWithWinner, Team } from './types';

export function compareClaimEvents(left: ClaimEvent, right: ClaimEvent) {
  if (left.claimedAt !== right.claimedAt) {
    return left.claimedAt - right.claimedAt;
  }

  return left.id.localeCompare(right.id);
}

export function getWinningClaim(events: ClaimEvent[]) {
  if (events.length === 0) {
    return undefined;
  }

  return [...events].sort(compareClaimEvents)[0];
}

export function buildTaskViews(
  tasks: Task[],
  teams: Team[],
  claimEvents: ClaimEvent[],
): TaskWithWinner[] {
  const teamById = new Map(teams.map(team => [team.id, team]));

  return tasks.map(task => {
    const taskClaims = claimEvents.filter(event => event.taskId === task.id);
    const winningClaim = getWinningClaim(taskClaims);

    return {
      ...task,
      winningClaim,
      winningTeam: winningClaim ? teamById.get(winningClaim.teamId) : undefined,
      claimCount: taskClaims.length,
    };
  });
}
