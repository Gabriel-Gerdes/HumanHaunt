import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';

const SCHEMA_VERSION = '1';

export async function runMigrations(db: QuickSQLiteConnection) {
  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY NOT NULL,
      game_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id)
    );
  `);

  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      game_id TEXT NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (game_id) REFERENCES games(id)
    );
  `);

  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS claim_events (
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
    CREATE TABLE IF NOT EXISTS sync_state (
      peer_id TEXT PRIMARY KEY NOT NULL,
      peer_name TEXT,
      last_seen_at INTEGER NOT NULL,
      last_event_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.executeAsync(`
    CREATE INDEX IF NOT EXISTS idx_claim_events_task_id
    ON claim_events(task_id);
  `);

  await db.executeAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?);',
    ['schema_version', SCHEMA_VERSION],
  );
}
