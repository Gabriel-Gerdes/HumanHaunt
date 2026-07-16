import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SyncPanel } from '../components/SyncPanel';
import { RankingsPanel } from '../components/RankingsPanel';
import { TaskRow } from '../components/TaskRow';
import { TeamPicker } from '../components/TeamPicker';
import { useGameSession } from '../hooks/useGameSession';

export function ChecklistScreen() {
  const {
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
  } = useGameSession();

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
        {selectedTeam ? (
          <Text style={styles.playingAs}>Playing as {selectedTeam.name}</Text>
        ) : null}
      </View>

      <TeamPicker
        teams={gameState.teams}
        selectedTeamId={gameState.device.selectedTeamId}
        onSelectTeam={handleSelectTeam}
      />

      <RankingsPanel standings={gameState.standings} />

      <SyncPanel
        status={syncStatus}
        onHost={handleHostSync}
        onJoin={handleJoinSync}
        onBroadcast={handleBroadcastClaims}
      />

      {!selectedTeam ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No team selected</Text>
          <Text style={styles.emptyBody}>
            Pick a team above, then claim open tasks for that team.
          </Text>
        </View>
      ) : null}

      {gameState.tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          selectedTeam={selectedTeam}
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
  emptyBody: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  emptyTitle: {
    color: '#92400e',
    fontSize: 16,
    fontWeight: '800',
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
  playingAs: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
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
