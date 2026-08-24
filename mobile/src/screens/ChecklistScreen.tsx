import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { CategoryTabs } from '../components/CategoryTabs';
import { RankingsPanel } from '../components/RankingsPanel';
import { SyncPanel } from '../components/SyncPanel';
import { TaskRow } from '../components/TaskRow';
import { TaskSearchBar } from '../components/TaskSearchBar';
import { TeamPicker } from '../components/TeamPicker';
import {
  groupTasksByCategory,
  tasksForCategory,
} from '../domain/categories';
import { filterTasksByTitleQuery } from '../domain/taskSearch';
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
    error,
    handleRefresh,
    handleSelectTeam,
    handleClaim,
    handleHostSync,
    handleJoinSync,
    handleBroadcastClaims,
  } = useGameSession();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');

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

    const categoryTasks = tasksForCategory(
      gameState.categories,
      gameState.tasks,
      selectedCategoryId,
    );

    return filterTasksByTitleQuery(categoryTasks, searchQuery);
  }, [gameState, searchQuery, selectedCategoryId]);

  const renderTaskItem = useCallback(
    ({ item }: { item: (typeof visibleTasks)[number] }) => (
      <TaskRow task={item} selectedTeam={selectedTeam} onClaim={handleClaim} />
    ),
    [handleClaim, selectedTeam],
  );

  if (!loading && !gameState) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Could not load game</Text>
        <Text style={styles.emptyBody}>
          {typeof error === 'string' && error
            ? error
            : 'Human Haunt data failed to load on this device.'}
        </Text>
        <Text
          style={styles.loadingText}
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Retry loading the game">
          Retry
        </Text>
      </View>
    );
  }

  if (loading || !gameState || !selectedCategoryId) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Human Haunt...</Text>
      </View>
    );
  }

  const emptyMessage = searchQuery.trim()
    ? 'No tasks match your search.'
    : 'No tasks in this category.';

  const listHeader = (
    <>
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

      <TaskSearchBar query={searchQuery} onChangeQuery={setSearchQuery} />

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
    </>
  );

  const listEmpty = (
    <View style={styles.emptyCategory}>
      <Text style={styles.emptyCategoryText}>{emptyMessage}</Text>
    </View>
  );

  return (
    <FlatList
      data={visibleTasks}
      keyExtractor={task => task.id}
      renderItem={renderTaskItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    />
  );
}
