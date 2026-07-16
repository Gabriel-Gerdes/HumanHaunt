import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TeamStanding } from '../domain/types';

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  claimMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  colorDot: {
    borderRadius: 6,
    height: 12,
    marginRight: 10,
    width: 12,
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
  rankBadge: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    height: 28,
    justifyContent: 'center',
    marginRight: 10,
    width: 28,
  },
  rankText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  score: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  teamMeta: {
    flex: 1,
  },
  teamName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
});
