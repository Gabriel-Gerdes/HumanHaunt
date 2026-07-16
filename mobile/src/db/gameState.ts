import { buildTaskViews } from '../domain/claimResolution';
import { buildTeamStandings } from '../domain/rankings';
import { DEFAULT_GAME_ID } from '../domain/seed';
import type { GameState } from '../domain/types';
import { getClaimEvents } from './claims';
import { getDb } from './connection';
import { ensureDevice } from './devices';
import { runMigrations } from './migrate';
import {
  mapGameRow,
  mapTaskRow,
  mapTeamRow,
  type GameRow,
  type TaskRow,
  type TeamRow,
} from './mappers';
import { rowsToArray } from './query';
import { seedDefaultGame } from './seedGame';

export async function initializeDatabase() {
  const db = getDb();

  await runMigrations(db);
  await seedDefaultGame(db);

  return ensureDevice(db);
}

export async function getGameState(): Promise<GameState> {
  const db = getDb();
  const device = await ensureDevice(db);

  const gameResult = await db.executeAsync(
    'SELECT id, name, created_at FROM games WHERE id = ?;',
    [DEFAULT_GAME_ID],
  );
  const game = mapGameRow(rowsToArray<GameRow>(gameResult)[0]);

  const teamResult = await db.executeAsync(
    'SELECT id, game_id, name, color, sort_order FROM teams WHERE game_id = ? ORDER BY sort_order;',
    [game.id],
  );
  const teams = rowsToArray<TeamRow>(teamResult).map(mapTeamRow);

  const taskResult = await db.executeAsync(
    `
    SELECT
      id,
      game_id,
      title,
      sort_order,
      active,
      base_points,
      current_points,
      points_visible
    FROM tasks
    WHERE game_id = ? AND active = 1
    ORDER BY sort_order;
    `,
    [game.id],
  );
  const tasks = rowsToArray<TaskRow>(taskResult).map(mapTaskRow);

  const claimEvents = await getClaimEvents();
  const taskViews = buildTaskViews(tasks, teams, claimEvents);

  return {
    game,
    device,
    teams,
    tasks: taskViews,
    claimEvents,
    standings: buildTeamStandings(teams, taskViews),
  };
}
