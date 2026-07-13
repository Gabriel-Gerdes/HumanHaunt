import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEFAULT_SYNC_PORT } from '../sync/peerSync';

type Props = {
  status: string;
  onHost: () => void;
  onJoin: (host: string) => void;
  onBroadcast: () => void;
};

export function SyncPanel({ status, onHost, onJoin, onBroadcast }: Props) {
  const [host, setHost] = useState('');

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Peer Sync</Text>
      <Text style={styles.body}>
        Start hosting on one phone, then join from another phone using the
        host phone's local Wi-Fi IP address.
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={onHost}>
          <Text style={styles.primaryButtonText}>Host :{DEFAULT_SYNC_PORT}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onBroadcast}>
          <Text style={styles.secondaryButtonText}>Broadcast Claims</Text>
        </Pressable>
      </View>

      <View style={styles.joinRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          onChangeText={setHost}
          placeholder="Host IP address"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={host}
        />
        <Pressable
          disabled={!host.trim()}
          onPress={() => onJoin(host.trim())}
          style={[styles.joinButton, !host.trim() && styles.disabledButton]}>
          <Text style={styles.joinButtonText}>Join</Text>
        </Pressable>
      </View>

      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  body: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  disabledButton: {
    opacity: 0.45,
  },
  input: {
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0f172a',
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  joinButton: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 18,
  },
  joinButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  secondaryButtonText: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  status: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 10,
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
});
