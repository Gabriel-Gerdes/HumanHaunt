import React from 'react';
import { Text, View } from 'react-native';

import type { TeamStanding } from '../domain/types';
import { styles } from './RankingsPanel.styles';

type Props = {
  standings: TeamStanding[];
};

export function RankingsPanel({ standings }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Standings</Text>
      <Text style={styles.hint}>Scores update as claims sync across phones.</Text>

      {standings.map(standing => (
        <View key={standing.team.id} style={styles.row}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{standing.rank}</Text>
          </View>
          <View
            style={[styles.colorDot, { backgroundColor: standing.team.color }]}
          />
          <View style={styles.teamMeta}>
            <Text style={styles.teamName}>{standing.team.name}</Text>
            <Text style={styles.claimMeta}>
              {standing.claimedTaskCount} claimed
            </Text>
          </View>
          <Text style={styles.score}>{standing.score}</Text>
        </View>
      ))}
    </View>
  );
}
