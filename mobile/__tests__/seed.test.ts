import {
  COMPLETED_CATEGORY_ID,
  DEFAULT_GAME_ID,
  defaultCategories,
  defaultGame,
  defaultTasks,
  defaultTeams,
} from '../src/domain/seed';

describe('seed data', () => {
  test('defaults reference the canonical game id', () => {
    expect(defaultGame.id).toBe(DEFAULT_GAME_ID);
    expect(defaultGame.id).toBe('human-haunt-2026');
    for (const team of defaultTeams) {
      expect(team.gameId).toBe(DEFAULT_GAME_ID);
    }
    for (const category of defaultCategories) {
      expect(category.gameId).toBe(DEFAULT_GAME_ID);
    }
    for (const task of defaultTasks) {
      expect(task.gameId).toBe(DEFAULT_GAME_ID);
    }
  });

  test('includes the system Completed category exactly once', () => {
    const completed = defaultCategories.filter(
      category => category.id === COMPLETED_CATEGORY_ID,
    );

    expect(completed).toHaveLength(1);
    expect(completed[0].isSystem).toBe(true);
  });

  test('exports are deeply frozen so runtime code cannot mutate them', () => {
    const exports = [defaultGame, defaultTeams, defaultCategories, defaultTasks];

    for (const value of exports) {
      expect(Object.isFrozen(value)).toBe(true);
    }

    // Nested objects must be frozen too, not just the top-level containers.
    for (const team of defaultTeams) {
      expect(Object.isFrozen(team)).toBe(true);
    }
    for (const task of defaultTasks) {
      expect(Object.isFrozen(task)).toBe(true);
    }
    for (const category of defaultCategories) {
      expect(Object.isFrozen(category)).toBe(true);
    }
  });
});
