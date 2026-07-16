import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CategoryTabs } from '../components/CategoryTabs';
import { RankingsPanel } from '../components/RankingsPanel';
import { SyncPanel } from '../components/SyncPanel';
import { TaskRow } from '../components/TaskRow';
import { TeamPicker } from '../components/TeamPicker';
import {
  groupTasksByCategory,
  tasksForCategory,
} from '../domain/categories';
import { useGameSession } from '../hooks/useGameSession';
import { styles } from './ChecklistScreen.styles';

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();

  useEffect(() => {
    if (!gameState?.categories.length) {
      return;
    }

    const stillValid = gameState.categories.some(
      category => category.id === selectedCategoryId,
    );
    if (!stillValid) {
      setSelectedCategoryId(gameState.categories[0].id);
    }
  }, [gameState?.categories, selectedCategoryId]);

  const categorySections = useMemo(
    () =>
      gameState
        ? groupTasksByCategory(gameState.categories, gameState.tasks)
        : [],
    [gameState],
  );

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const section of categorySections) {
      counts[section.category.id] = section.tasks.length;
    }
    return counts;
  }, [categorySections]);

  const visibleTasks = useMemo(() => {
    if (!gameState || !selectedCategoryId) {
      return [];
    }

    return tasksForCategory(
      gameState.categories,
      gameState.tasks,
      selectedCategoryId,
    );
  }, [gameState, selectedCategoryId]);

  if (loading || !gameState || !selectedCategoryId) {
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

      <CategoryTabs
        categories={gameState.categories}
        selectedCategoryId={selectedCategoryId}
        taskCounts={taskCounts}
        onSelectCategory={setSelectedCategoryId}
      />

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

      {visibleTasks.length === 0 ? (
        <View style={styles.emptyCategory}>
          <Text style={styles.emptyCategoryText}>No tasks in this category.</Text>
        </View>
      ) : (
        visibleTasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            selectedTeam={selectedTeam}
            onClaim={handleClaim}
          />
        ))
      )}
    </ScrollView>
  );
}
