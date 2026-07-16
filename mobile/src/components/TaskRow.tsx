import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TaskWithWinner, Team } from '../domain/types';

type Props = {
  task: TaskWithWinner;
  selectedTeam?: Team;
  onClaim: (taskId: string) => void;
};

export function TaskRow({ task, selectedTeam, onClaim }: Props) {
  const isClaimed = Boolean(task.winningTeam);
  const canClaim = Boolean(selectedTeam) && !isClaimed;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        {task.winningTeam ? (
          <Text style={styles.winner}>Claimed by {task.winningTeam.name}</Text>
        ) : (
          <Text style={styles.open}>Open</Text>
        )}
      </View>

      {isClaimed ? (
        <View
          style={[
            styles.claimedBadge,
            task.winningTeam
              ? {
                  backgroundColor: task.winningTeam.color,
                  borderColor: task.winningTeam.color,
                }
              : null,
          ]}>
          <Text style={styles.claimedBadgeText}>
            {task.winningTeam?.name ?? 'Claimed'}
          </Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canClaim }}
          disabled={!canClaim}
          onPress={() => onClaim(task.id)}
          style={[styles.claimButton, !canClaim && styles.claimButtonDisabled]}>
          <Text
            style={[
              styles.claimButtonText,
              !canClaim && styles.claimButtonTextDisabled,
            ]}>
            {selectedTeam
              ? `Claim for ${selectedTeam.name}`
              : 'Select a team to claim'}
          </Text>
        </Pressable>
      )}

      {task.claimCount > 1 ? (
        <Text style={styles.conflict}>
          {task.claimCount} synced claims; earliest claim is the winner.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  claimButton: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  claimButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  claimButtonTextDisabled: {
    color: '#64748b',
  },
  claimedBadge: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  claimedBadgeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  conflict: {
    color: '#92400e',
    fontSize: 12,
    marginTop: 10,
  },
  header: {
    gap: 4,
    marginBottom: 12,
  },
  open: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  winner: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
});
