import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TaskWithWinner, Team } from '../domain/types';

type Props = {
  task: TaskWithWinner;
  teams: Team[];
  onClaim: (taskId: string, teamId: string) => void;
};

export function TaskRow({ task, teams, onClaim }: Props) {
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

      <View style={styles.teamGrid}>
        {teams.map(team => {
          const isWinner = task.winningTeam?.id === team.id;
          const isLockedOut = Boolean(task.winningTeam && !isWinner);

          return (
            <Pressable
              key={team.id}
              accessibilityRole="button"
              accessibilityState={{ disabled: isLockedOut }}
              disabled={isLockedOut || Boolean(task.winningTeam)}
              onPress={() => onClaim(task.id, team.id)}
              style={[
                styles.teamButton,
                isWinner && { backgroundColor: team.color, borderColor: team.color },
                isLockedOut && styles.lockedButton,
              ]}>
              <Text
                style={[
                  styles.teamButtonText,
                  isWinner && styles.winnerButtonText,
                  isLockedOut && styles.lockedButtonText,
                ]}>
                {isWinner ? 'Won' : team.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
  conflict: {
    color: '#92400e',
    fontSize: 12,
    marginTop: 10,
  },
  header: {
    gap: 4,
    marginBottom: 12,
  },
  lockedButton: {
    backgroundColor: '#e5e7eb',
    borderColor: '#d1d5db',
  },
  lockedButtonText: {
    color: '#6b7280',
  },
  open: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
  teamButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  teamButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  teamGrid: {
    flexDirection: 'row',
    gap: 8,
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
  winnerButtonText: {
    color: '#ffffff',
  },
});
