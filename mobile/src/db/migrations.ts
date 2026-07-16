import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';

const TARGET_SCHEMA_VERSION = 2;

async function getSchemaVersion(db: QuickSQLiteConnection): Promise<number> {
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
}

async function setSchemaVersion(db: QuickSQLiteConnection, version: number) {
  await db.executeAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?);',
    ['schema_version', String(version)],
  );
}

async function createBaseSchema(db: QuickSQLiteConnection) {
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
      base_points INTEGER NOT NULL DEFAULT 0,
      current_points INTEGER NOT NULL DEFAULT 0,
      points_visible INTEGER NOT NULL DEFAULT 1,
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
}

async function tableHasColumn(
  db: QuickSQLiteConnection,
  tableName: string,
  columnName: string,
) {
  const result = await db.executeAsync(`PRAGMA table_info(${tableName});`);
  const columns = (result.rows?._array ?? []) as Array<{ name: string }>;
  return columns.some(column => column.name === columnName);
}

async function migrateToV2(db: QuickSQLiteConnection) {
  // Older installs created `tasks` without points columns.
  if (!(await tableHasColumn(db, 'tasks', 'base_points'))) {
    await db.executeAsync(
      'ALTER TABLE tasks ADD COLUMN base_points INTEGER NOT NULL DEFAULT 0;',
    );
  }

  if (!(await tableHasColumn(db, 'tasks', 'current_points'))) {
    await db.executeAsync(
      'ALTER TABLE tasks ADD COLUMN current_points INTEGER NOT NULL DEFAULT 0;',
    );
  }

  if (!(await tableHasColumn(db, 'tasks', 'points_visible'))) {
    await db.executeAsync(
      'ALTER TABLE tasks ADD COLUMN points_visible INTEGER NOT NULL DEFAULT 1;',
    );
  }

  // Backfill known seed tasks that were inserted before points existed.
  const seedPointValues: Array<[string, number]> = [
    ['task-biff-lime', 10],
    ['task-tiny-pizza-car', 15],
    ['task-norfolk-mermaid', 20],
    ['task-mowhawk', 10],
    ['task-dog-stroller', 25],
  ];

  for (const [taskId, points] of seedPointValues) {
    await db.executeAsync(
      `
      UPDATE tasks
      SET
        base_points = ?,
        current_points = ?,
        points_visible = 1
      WHERE id = ? AND base_points = 0 AND current_points = 0;
      `,
      [points, points, taskId],
    );
  }
}

export async function runMigrations(db: QuickSQLiteConnection) {
  await createBaseSchema(db);

  let version = await getSchemaVersion(db);

  // Fresh DB: base schema already includes v2 task columns.
  if (version === 0) {
    await setSchemaVersion(db, TARGET_SCHEMA_VERSION);
    return;
  }

  if (version < 2) {
    await migrateToV2(db);
    version = 2;
    await setSchemaVersion(db, version);
  }
}
