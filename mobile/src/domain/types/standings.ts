import type { Team } from './game';

export type TeamStanding = {
  team: Team;
  score: number;
  rank: number;
  claimedTaskCount: number;
};
