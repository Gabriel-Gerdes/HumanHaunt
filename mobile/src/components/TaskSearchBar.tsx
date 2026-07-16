import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { styles } from './TaskSearchBar.styles';

type Props = {
  query: string;
  onChangeQuery: (query: string) => void;
};

export function TaskSearchBar({ query, onChangeQuery }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Search tasks</Text>
      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={onChangeQuery}
          placeholder="Search by task title"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => onChangeQuery('')}
            style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
