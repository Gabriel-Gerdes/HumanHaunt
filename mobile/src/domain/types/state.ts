import type { ClaimEvent } from './claims';
import type { Device } from './device';
import type { Game, Task, Team } from './game';

export type TaskWithWinner = Task & {
  winningClaim?: ClaimEvent;
  winningTeam?: Team;
  claimCount: number;
};

export type GameState = {
  game: Game;
  device: Device;
  teams: Team[];
  tasks: TaskWithWinner[];
  claimEvents: ClaimEvent[];
};
