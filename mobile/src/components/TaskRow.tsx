import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { TaskWithWinner, Team } from '../domain/types';
import { styles } from './TaskRow.styles';

type Props = {
  task: TaskWithWinner;
  selectedTeam?: Team;
  onClaim: (taskId: string) => void;
};

export function TaskRow({ task, selectedTeam, onClaim }: Props) {
  const isClaimed = Boolean(task.winningTeam);
  const canClaim = Boolean(selectedTeam) && !isClaimed;

  return (
    <View style={[styles.card, isClaimed && styles.cardCompleted]}>
      <View style={styles.header}>
        <Text style={[styles.title, isClaimed && styles.textMuted]}>
          {task.title}
        </Text>
        {task.pointsVisible ? (
          <Text style={[styles.points, isClaimed && styles.textMuted]}>
            {task.currentPoints} pts
          </Text>
        ) : null}
        {task.winningTeam ? (
          <Text style={[styles.winner, isClaimed && styles.textMuted]}>
            Claimed by {task.winningTeam.name}
          </Text>
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
