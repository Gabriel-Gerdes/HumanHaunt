import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';

/**
 * Bump this whenever the schema shape changes.
 * Outdated databases are rebuilt from scratch (acceptable while the app is early).
 * Starts at 4 so installs that recorded legacy incremental versions 1–3 also rebuild.
 */
export const SCHEMA_VERSION = 4;

const TABLE_NAMES = [
  'claim_events',
  'sync_state',
  'tasks',
  'teams',
  'devices',
  'games',
  'metadata',
] as const;

export async function dropAllTables(db: QuickSQLiteConnection) {
  await db.executeAsync('PRAGMA foreign_keys = OFF;');

  for (const tableName of TABLE_NAMES) {
    await db.executeAsync(`DROP TABLE IF EXISTS ${tableName};`);
  }

  await db.executeAsync('PRAGMA foreign_keys = ON;');
}

/** Creates the full current schema. Safe to call only on an empty database. */
export async function createSchema(db: QuickSQLiteConnection) {
  await db.executeAsync(`
    CREATE TABLE metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await db.executeAsync(`
    CREATE TABLE games (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await db.executeAsync(`
    CREATE TABLE teams (
      id TEXT PRIMARY KEY NOT NULL,
      game_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id)
    );
  `);

  await db.executeAsync(`
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY NOT NULL,
      game_id TEXT NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      base_points INTEGER NOT NULL DEFAULT 0,
      current_points INTEGER NOT NULL DEFAULT 0,
      points_visible INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (game_id) REFERENCES games(id)
    );
  `);

  await db.executeAsync(`
    CREATE TABLE devices (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      selected_team_id TEXT
    );
  `);

  await db.executeAsync(`
    CREATE TABLE claim_events (
      id TEXT PRIMARY KEY NOT NULL,
      game_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      claimed_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      received_at INTEGER NOT NULL,
      source TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );
  `);

  await db.executeAsync(`
    CREATE TABLE sync_state (
      peer_id TEXT PRIMARY KEY NOT NULL,
      peer_name TEXT,
      last_seen_at INTEGER NOT NULL,
      last_event_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.executeAsync(`
    CREATE INDEX idx_claim_events_task_id
    ON claim_events(task_id);
  `);
}

export async function getSchemaVersion(
  db: QuickSQLiteConnection,
): Promise<number> {
  try {
    const result = await db.executeAsync(
      'SELECT value FROM metadata WHERE key = ?;',
      ['schema_version'],
    );
    const row = (result.rows?._array ?? [])[0] as { value: string } | undefined;

    if (!row) {
      return 0;
    }

    const parsed = Number.parseInt(row.value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function setSchemaVersion(
  db: QuickSQLiteConnection,
  version: number,
) {
  await db.executeAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?);',
    ['schema_version', String(version)],
  );
}
