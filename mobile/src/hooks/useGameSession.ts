import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import {
  claimTask,
  getClaimEvents,
  getGameState,
  importClaimEvents,
  initializeDatabase,
  setSelectedTeam,
} from '../db';
import { resolveSelectedTeam } from '../domain/teamSelection';
import type { GameState, Team } from '../domain/types';
import { PeerSyncService } from '../sync/peerSync';

type UseGameSessionResult = {
  gameState?: GameState;
  loading: boolean;
  refreshing: boolean;
  syncStatus: string;
  claimedCount: number;
  selectedTeam?: Team;
  handleRefresh: () => Promise<void>;
  handleSelectTeam: (teamId: string) => Promise<void>;
  handleClaim: (taskId: string) => Promise<void>;
  handleHostSync: () => void;
  handleJoinSync: (host: string) => Promise<void>;
  handleBroadcastClaims: () => Promise<void>;
};

export function useGameSession(): UseGameSessionResult {
  const [gameState, setGameState] = useState<GameState>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Peer sync not started');
  const syncServiceRef = useRef<PeerSyncService | undefined>(undefined);
  const syncDeviceId = gameState?.device.id;
  const syncDeviceName = gameState?.device.name;
  const syncDeviceCreatedAt = gameState?.device.createdAt;

  const claimedCount = useMemo(
    () => gameState?.tasks.filter(task => task.winningClaim).length ?? 0,
    [gameState],
  );

  const selectedTeam = useMemo(
    () =>
      gameState
        ? resolveSelectedTeam(gameState.teams, gameState.device.selectedTeamId)
        : undefined,
    [gameState],
  );

  const loadGame = useCallback(async () => {
    const state = await getGameState();
    setGameState(state);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await initializeDatabase();
        const state = await getGameState();

        if (mounted) {
          setGameState(state);
        }
      } catch (error) {
        Alert.alert('Database error', String(error));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      !syncDeviceId ||
      !syncDeviceName ||
      !syncDeviceCreatedAt ||
      syncServiceRef.current
    ) {
      return;
    }

    const syncService = new PeerSyncService({
      device: {
        id: syncDeviceId,
        name: syncDeviceName,
        createdAt: syncDeviceCreatedAt,
      },
      getEvents: getClaimEvents,
      importEvents: importClaimEvents,
      onImportedEvents: loadGame,
      onStatus: setSyncStatus,
    });

    syncServiceRef.current = syncService;

    return () => {
      syncService.stop();
      syncServiceRef.current = undefined;
    };
  }, [loadGame, syncDeviceCreatedAt, syncDeviceId, syncDeviceName]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadGame();
    } finally {
      setRefreshing(false);
    }
  }, [loadGame]);

  const handleSelectTeam = useCallback(
    async (teamId: string) => {
      await setSelectedTeam(teamId);
      await loadGame();
    },
    [loadGame],
  );

  const handleClaim = useCallback(
    async (taskId: string) => {
      if (!selectedTeam) {
        Alert.alert('Select a team', 'Choose your team before claiming a task.');
        return;
      }

      const result = await claimTask(taskId, selectedTeam.id);
      await loadGame();
      await syncServiceRef.current?.broadcastEvents();

      if (result.status === 'already_claimed') {
        Alert.alert(
          'Task already claimed',
          'Another synced claim already owns this task.',
        );
      }
    },
    [loadGame, selectedTeam],
  );

  const handleHostSync = useCallback(() => {
    syncServiceRef.current?.startServer();
  }, []);

  const handleJoinSync = useCallback(
    async (host: string) => {
      try {
        await syncServiceRef.current?.connectToPeer(host);
        await loadGame();
      } catch (error) {
        Alert.alert('Peer sync failed', String(error));
      }
    },
    [loadGame],
  );

  const handleBroadcastClaims = useCallback(async () => {
    await syncServiceRef.current?.broadcastEvents();
  }, []);

  return {
    gameState,
    loading,
    refreshing,
    syncStatus,
    claimedCount,
    selectedTeam,
    handleRefresh,
    handleSelectTeam,
    handleClaim,
    handleHostSync,
    handleJoinSync,
    handleBroadcastClaims,
  };
}
