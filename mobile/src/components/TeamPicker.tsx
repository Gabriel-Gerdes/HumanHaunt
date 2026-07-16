import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Team } from '../domain/types';
import { styles } from './TeamPicker.styles';

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
