import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';

import {
  defaultCategories,
  defaultGame,
  defaultTasks,
  defaultTeams,
  DEFAULT_GAME_ID,
} from '../domain/seed';
import { rowsToArray } from './query';

export async function seedDefaultGame(db: QuickSQLiteConnection) {
  const gameResult = await db.executeAsync(
    'SELECT COUNT(*) AS count FROM games WHERE id = ?;',
    [DEFAULT_GAME_ID],
  );
  const [{ count }] = rowsToArray<{ count: number }>(gameResult);

  if (count > 0) {
    return;
  }

  const createdAt = Date.now();

  await db.executeAsync(
    'INSERT INTO games (id, name, created_at) VALUES (?, ?, ?);',
    [defaultGame.id, defaultGame.name, createdAt],
  );

  for (const team of defaultTeams) {
    await db.executeAsync(
      `
      INSERT INTO teams (id, game_id, name, color, sort_order)
      VALUES (?, ?, ?, ?, ?);
      `,
      [team.id, team.gameId, team.name, team.color, team.sortOrder],
    );
  }

  for (const category of defaultCategories) {
    await db.executeAsync(
      `
      INSERT INTO task_categories (
        id,
        game_id,
        name,
        sort_order,
        color,
        active,
        is_system
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [
        category.id,
        category.gameId,
        category.name,
        category.sortOrder,
        category.color,
        category.active ? 1 : 0,
        category.isSystem ? 1 : 0,
      ],
    );
  }

  for (const task of defaultTasks) {
    await db.executeAsync(
      `
      INSERT INTO tasks (
        id,
        game_id,
        category_id,
        title,
        sort_order,
        active,
        base_points,
        current_points,
        points_visible
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        task.id,
        task.gameId,
        task.categoryId,
        task.title,
        task.sortOrder,
        task.active ? 1 : 0,
        task.basePoints,
        task.currentPoints,
        task.pointsVisible ? 1 : 0,
      ],
    );
  }
}
