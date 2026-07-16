import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TaskCategory } from '../domain/types';

type Props = {
  categories: TaskCategory[];
  selectedCategoryId: string;
  taskCounts: Record<string, number>;
  onSelectCategory: (categoryId: string) => void;
};

export function CategoryTabs({
  categories,
  selectedCategoryId,
  taskCounts,
  onSelectCategory,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {categories.map(category => {
          const selected = category.id === selectedCategoryId;
          const count = taskCounts[category.id] ?? 0;

          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelectCategory(category.id)}
              style={[
                styles.tab,
                selected && {
                  backgroundColor: category.color,
                  borderColor: category.color,
                },
              ]}>
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {category.name}
              </Text>
              <Text
                style={[styles.countText, selected && styles.tabTextSelected]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  countText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  label: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  row: {
    gap: 8,
    paddingRight: 8,
  },
  tab: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  tabTextSelected: {
    color: '#ffffff',
  },
  wrap: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
});
