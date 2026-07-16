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

export type ClaimResult =
  | {
      status: 'claimed';
      event: ClaimEvent;
    }
  | {
      status: 'already_claimed';
      winningClaim: ClaimEvent;
    };
