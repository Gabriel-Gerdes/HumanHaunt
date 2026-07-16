import type { ClaimEvent, Device } from '../domain/types';

export type SyncMessage =
  | {
      type: 'hello';
      device: Device;
    }
  | {
      type: 'request_events';
      deviceId: string;
    }
  | {
      type: 'claim_events';
      events: ClaimEvent[];
    };

export type PeerSyncOptions = {
  device: Device;
  getEvents: () => Promise<ClaimEvent[]>;
  importEvents: (events: ClaimEvent[]) => Promise<number>;
  onImportedEvents: () => void;
  onStatus: (status: string) => void;
};
