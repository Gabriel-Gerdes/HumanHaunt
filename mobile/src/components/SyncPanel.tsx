import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DEFAULT_SYNC_PORT } from '../sync/peerSync';
import { styles } from './SyncPanel.styles';

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
