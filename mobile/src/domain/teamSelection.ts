import type { Team } from './types';

/**
 * Resolves which team a claim should use for the local player.
 * Returns undefined when no team is selected or the selection is unknown.
 */
export function resolveSelectedTeam(
  teams: Team[],
  selectedTeamId: string | undefined,
): Team | undefined {
  if (!selectedTeamId) {
    return undefined;
  }

  return teams.find(team => team.id === selectedTeamId);
}

export function canClaimWithSelectedTeam(
  selectedTeam: Team | undefined,
  taskAlreadyClaimed: boolean,
): boolean {
  return Boolean(selectedTeam) && !taskAlreadyClaimed;
}
