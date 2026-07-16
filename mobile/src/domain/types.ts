export type Game = {
  id: string;
  name: string;
  createdAt: number;
};

export type Team = {
  id: string;
  gameId: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type Task = {
  id: string;
  gameId: string;
  title: string;
  sortOrder: number;
  active: boolean;
  /** Points when the task was created / last reset to base value. */
  basePoints: number;
  /** Points used for scoring; may rise when unclaimed tasks carry into later phases. */
  currentPoints: number;
  /** When false, player UI may hide exact point values (Phase 5). */
  pointsVisible: boolean;
};

export type Device = {
  id: string;
  name: string;
  createdAt: number;
};

export type ClaimEvent = {
  id: string;
  gameId: string;
  taskId: string;
  teamId: string;
  deviceId: string;
  claimedAt: number;
  createdAt: number;
  receivedAt: number;
  source: 'local' | 'peer' | 'seed';
};

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

export type ClaimResult =
  | {
      status: 'claimed';
      event: ClaimEvent;
    }
  | {
      status: 'already_claimed';
      winningClaim: ClaimEvent;
    };
