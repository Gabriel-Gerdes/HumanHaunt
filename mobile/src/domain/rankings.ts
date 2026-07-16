import type { Team } from './types';
import type { TaskWithWinner } from './types';
import type { TeamStanding } from './types';

function compareStandings(left: TeamStanding, right: TeamStanding) {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  return left.team.name.localeCompare(right.team.name);
}

/**
 * Builds ordered team standings from current task winners.
 * Score uses each won task's `currentPoints`. Tied scores share a rank.
 */
export function buildTeamStandings(
  teams: Team[],
  tasks: TaskWithWinner[],
): TeamStanding[] {
  const totals = new Map<string, { score: number; claimedTaskCount: number }>();

  for (const team of teams) {
    totals.set(team.id, { score: 0, claimedTaskCount: 0 });
  }

  for (const task of tasks) {
    const winnerId = task.winningTeam?.id ?? task.winningClaim?.teamId;
    if (!winnerId) {
      continue;
    }

    const current = totals.get(winnerId);
    if (!current) {
      continue;
    }

    current.score += task.currentPoints;
    current.claimedTaskCount += 1;
  }

  const ordered: TeamStanding[] = teams
    .map(team => {
      const total = totals.get(team.id) ?? { score: 0, claimedTaskCount: 0 };
      return {
        team,
        score: total.score,
        claimedTaskCount: total.claimedTaskCount,
        rank: 0,
      };
    })
    .sort(compareStandings);

  let previousScore: number | undefined;
  let previousRank = 0;

  return ordered.map((standing, index) => {
    const rank =
      previousScore === standing.score ? previousRank : index + 1;
    previousScore = standing.score;
    previousRank = rank;

    return {
      ...standing,
      rank,
    };
  });
}
