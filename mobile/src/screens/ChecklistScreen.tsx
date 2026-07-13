import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TaskRow } from '../components/TaskRow';
import { SyncPanel } from '../components/SyncPanel';
import {
  claimTask,
  getClaimEvents,
  getGameState,
  importClaimEvents,
  initializeDatabase,
} from '../db/database';
import type { GameState } from '../domain/types';
import { PeerSyncService } from '../sync/peerSync';

export function ChecklistScreen() {
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

  const handleClaim = useCallback(
    async (taskId: string, teamId: string) => {
      const result = await claimTask(taskId, teamId);
      await loadGame();
      await syncServiceRef.current?.broadcastEvents();

      if (result.status === 'already_claimed') {
        Alert.alert(
          'Task already claimed',
          'Another synced claim already owns this task.',
        );
      }
    },
    [loadGame],
  );

  const handleHostSync = useCallback(() => {
    syncServiceRef.current?.startServer();
  }, []);

  const handleJoinSync = useCallback(async (host: string) => {
    try {
      await syncServiceRef.current?.connectToPeer(host);
      await loadGame();
    } catch (error) {
      Alert.alert('Peer sync failed', String(error));
    }
  }, [loadGame]);

  const handleBroadcastClaims = useCallback(async () => {
    await syncServiceRef.current?.broadcastEvents();
  }, []);

  if (loading || !gameState) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Human Haunt...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      style={styles.screen}
      contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Local game</Text>
        <Text style={styles.title}>{gameState.game.name}</Text>
        <Text style={styles.subtitle}>
          {claimedCount} of {gameState.tasks.length} tasks claimed on this phone.
        </Text>
        <Text style={styles.device}>Device: {gameState.device.id}</Text>
      </View>

      <SyncPanel
        status={syncStatus}
        onHost={handleHostSync}
        onJoin={handleJoinSync}
        onBroadcast={handleBroadcastClaims}
      />

      {gameState.tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          teams={gameState.teams}
          onClaim={handleClaim}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: '#eef2f7',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  device: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 10,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  loadingText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: '#eef2f7',
    flex: 1,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    marginTop: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },
});
