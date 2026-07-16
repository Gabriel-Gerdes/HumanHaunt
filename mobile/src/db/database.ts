import {
  open,
  type QueryResult,
  type QuickSQLiteConnection,
} from 'react-native-quick-sqlite';

import { buildTaskViews, getWinningClaim } from '../domain/claimResolution';
import {
  defaultGame,
  defaultTasks,
  defaultTeams,
  DEFAULT_GAME_ID,
} from '../domain/seed';
import type {
  ClaimEvent,
  Device,
  Game,
  GameState,
  Team,
} from '../domain/types';
import { createId } from '../utils/id';
import { mapTaskRow } from './mappers';
import { runMigrations } from './migrations';

const DATABASE_NAME = 'humanhaunt.db';

let dbConnection: QuickSQLiteConnection | undefined;

function getDb() {
  if (!dbConnection) {
    dbConnection = open({
      name: DATABASE_NAME,
      location: 'default',
    });
  }

  return dbConnection;
}

function rowsToArray<T>(result: QueryResult): T[] {
  return (result.rows?._array ?? []) as T[];
}

function mapGame(row: { id: string; name: string; created_at: number }): Game {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function mapTeam(row: {
  id: string;
  game_id: string;
  name: string;
  color: string;
  sort_order: number;
}): Team {
  return {
    id: row.id,
    gameId: row.game_id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

function mapDevice(row: { id: string; name: string; created_at: number }): Device {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function mapClaimEvent(row: {
  id: string;
  game_id: string;
  task_id: string;
  team_id: string;
  device_id: string;
  claimed_at: number;
  created_at: number;
  received_at: number;
  source: ClaimEvent['source'];
}): ClaimEvent {
  return {
    id: row.id,
    gameId: row.game_id,
    taskId: row.task_id,
    teamId: row.team_id,
    deviceId: row.device_id,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    receivedAt: row.received_at,
    source: row.source,
  };
}

async function seedDefaultGame(db: QuickSQLiteConnection) {
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

  for (const task of defaultTasks) {
    await db.executeAsync(
      `
      INSERT INTO tasks (
        id,
        game_id,
        title,
        sort_order,
        active,
        base_points,
        current_points,
        points_visible
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        task.id,
        task.gameId,
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

async function ensureDevice(db: QuickSQLiteConnection) {
  const result = await db.executeAsync(
    'SELECT id, name, created_at FROM devices ORDER BY created_at LIMIT 1;',
  );
  const existingDevice = rowsToArray<{
    id: string;
    name: string;
    created_at: number;
  }>(result)[0];

  if (existingDevice) {
    return mapDevice(existingDevice);
  }

  const device: Device = {
    id: createId('device'),
    name: 'This Phone',
    createdAt: Date.now(),
  };

  await db.executeAsync(
    'INSERT INTO devices (id, name, created_at) VALUES (?, ?, ?);',
    [device.id, device.name, device.createdAt],
  );

  return device;
}

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
  const game = mapGame(
    rowsToArray<{ id: string; name: string; created_at: number }>(gameResult)[0],
  );

  const teamResult = await db.executeAsync(
    'SELECT id, game_id, name, color, sort_order FROM teams WHERE game_id = ? ORDER BY sort_order;',
    [game.id],
  );
  const teams = rowsToArray<{
    id: string;
    game_id: string;
    name: string;
    color: string;
    sort_order: number;
  }>(teamResult).map(mapTeam);

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
  const tasks = rowsToArray<{
    id: string;
    game_id: string;
    title: string;
    sort_order: number;
    active: number;
    base_points: number;
    current_points: number;
    points_visible: number;
  }>(taskResult).map(mapTaskRow);

  const claimEvents = await getClaimEvents();

  return {
    game,
    device,
    teams,
    tasks: buildTaskViews(tasks, teams, claimEvents),
    claimEvents,
  };
}

export async function getClaimEvents() {
  const db = getDb();
  const result = await db.executeAsync(
    `
    SELECT id, game_id, task_id, team_id, device_id, claimed_at, created_at, received_at, source
    FROM claim_events
    ORDER BY claimed_at, id;
    `,
  );

  return rowsToArray<{
    id: string;
    game_id: string;
    task_id: string;
    team_id: string;
    device_id: string;
    claimed_at: number;
    created_at: number;
    received_at: number;
    source: ClaimEvent['source'];
  }>(result).map(mapClaimEvent);
}

export async function claimTask(taskId: string, teamId: string) {
  const db = getDb();
  const device = await ensureDevice(db);
  const allClaims = await getClaimEvents();
  const winningClaim = getWinningClaim(
    allClaims.filter(event => event.taskId === taskId),
  );

  if (winningClaim) {
    return {
      status: 'already_claimed',
      winningClaim,
    } as const;
  }

  const now = Date.now();
  const event: ClaimEvent = {
    id: createId('claim'),
    gameId: DEFAULT_GAME_ID,
    taskId,
    teamId,
    deviceId: device.id,
    claimedAt: now,
    createdAt: now,
    receivedAt: now,
    source: 'local',
  };

  await insertClaimEvent(db, event);

  return {
    status: 'claimed',
    event,
  } as const;
}

async function insertClaimEvent(db: QuickSQLiteConnection, event: ClaimEvent) {
  await db.executeAsync(
    `
    INSERT OR IGNORE INTO claim_events (
      id,
      game_id,
      task_id,
      team_id,
      device_id,
      claimed_at,
      created_at,
      received_at,
      source
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      event.id,
      event.gameId,
      event.taskId,
      event.teamId,
      event.deviceId,
      event.claimedAt,
      event.createdAt,
      event.receivedAt,
      event.source,
    ],
  );
}

export async function importClaimEvents(events: ClaimEvent[]) {
  const db = getDb();
  let importedCount = 0;

  for (const event of events) {
    const beforeResult = await db.executeAsync(
      'SELECT COUNT(*) AS count FROM claim_events WHERE id = ?;',
      [event.id],
    );
    const before = rowsToArray<{ count: number }>(beforeResult)[0].count;

    await insertClaimEvent(db, {
      ...event,
      receivedAt: Date.now(),
      source: event.source === 'local' ? 'peer' : event.source,
    });

    if (before === 0) {
      importedCount += 1;
    }
  }

  return importedCount;
}
