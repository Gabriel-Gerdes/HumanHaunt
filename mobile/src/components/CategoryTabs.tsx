import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { TaskCategory } from '../domain/types';
import { styles } from './CategoryTabs.styles';

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
