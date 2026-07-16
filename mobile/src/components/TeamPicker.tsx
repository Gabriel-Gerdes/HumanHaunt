import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Team } from '../domain/types';

type Props = {
  teams: Team[];
  selectedTeamId?: string;
  onSelectTeam: (teamId: string) => void;
};

export function TeamPicker({ teams, selectedTeamId, onSelectTeam }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Playing as</Text>
      {selectedTeamId ? (
        <Text style={styles.hint}>
          Claims will score for your selected team. Tap another team to switch.
        </Text>
      ) : (
        <Text style={styles.prompt}>Select your team to start claiming tasks.</Text>
      )}

      <View style={styles.teamGrid}>
        {teams.map(team => {
          const isSelected = team.id === selectedTeamId;

          return (
            <Pressable
              key={team.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectTeam(team.id)}
              style={[
                styles.teamButton,
                isSelected && {
                  backgroundColor: team.color,
                  borderColor: team.color,
                },
              ]}>
              <Text
                style={[
                  styles.teamButtonText,
                  isSelected && styles.selectedTeamText,
                ]}>
                {team.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  hint: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  label: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  prompt: {
    color: '#b45309',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  selectedTeamText: {
    color: '#ffffff',
  },
  teamButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  teamButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  teamGrid: {
    flexDirection: 'row',
    gap: 8,
  },
});
