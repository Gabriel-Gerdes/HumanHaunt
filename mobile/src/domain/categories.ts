import type { TaskCategory, TaskWithWinner } from './types';
import { COMPLETED_CATEGORY_ID } from './seed';

export type CategorySection = {
  category: TaskCategory;
  tasks: TaskWithWinner[];
};

/**
 * Groups tasks for UI navigation.
 * Open tasks stay in their package category; claimed tasks move to Completed.
 */
export function groupTasksByCategory(
  categories: TaskCategory[],
  tasks: TaskWithWinner[],
): CategorySection[] {
  const orderedCategories = [...categories]
    .filter(category => category.active)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return orderedCategories.map(category => {
    const sectionTasks =
      category.id === COMPLETED_CATEGORY_ID
        ? tasks.filter(task => Boolean(task.winningClaim))
        : tasks.filter(
            task =>
              !task.winningClaim && task.categoryId === category.id,
          );

    return {
      category,
      tasks: [...sectionTasks].sort((left, right) => left.sortOrder - right.sortOrder),
    };
  });
}

export function tasksForCategory(
  categories: TaskCategory[],
  tasks: TaskWithWinner[],
  categoryId: string,
): TaskWithWinner[] {
  const section = groupTasksByCategory(categories, tasks).find(
    entry => entry.category.id === categoryId,
  );
  return section?.tasks ?? [];
}
