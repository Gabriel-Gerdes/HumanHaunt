import type { ClaimEvent } from './claims';
import type { Device } from './device';
import type { Game, Task, TaskCategory, Team } from './game';
import type { TeamStanding } from './standings';

export type TaskWithWinner = Task & {
  winningClaim?: ClaimEvent;
  winningTeam?: Team;
  claimCount: number;
};

export type GameState = {
  game: Game;
  device: Device;
  teams: Team[];
  categories: TaskCategory[];
  tasks: TaskWithWinner[];
  claimEvents: ClaimEvent[];
  standings: TeamStanding[];
};
