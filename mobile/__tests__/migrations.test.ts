import type { QueryResult, QuickSQLiteConnection } from 'react-native-quick-sqlite';

import { runMigrations, TARGET_SCHEMA_VERSION } from '../src/db/migrations';
import { defaultTasks } from '../src/domain/seed';

type ColumnInfo = { name: string };

type FakeDbOptions = {
  initialSchemaVersion?: number;
  initialTaskColumns?: string[];
};

/**
 * Minimal SQLite stand-in for migration unit tests.
 * Tracks schema version, task columns, and seed backfill updates.
 */
function createFakeDb(options: FakeDbOptions = {}) {
  const metadata = new Map<string, string>();
  if (options.initialSchemaVersion !== undefined) {
    metadata.set('schema_version', String(options.initialSchemaVersion));
  }

  const legacyTaskColumns = [
    'id',
    'game_id',
    'title',
    'sort_order',
    'active',
  ];
  const tasksTableExists = options.initialTaskColumns !== undefined;
  const taskColumns = new Set(
    options.initialTaskColumns ?? [...legacyTaskColumns],
  );

  const taskPoints = new Map<
    string,
    { basePoints: number; currentPoints: number; pointsVisible: number }
  >();

  const statements: Array<{ sql: string; params?: unknown[] }> = [];

  const executeAsync = jest.fn(
    async (sql: string, params?: unknown[]): Promise<QueryResult> => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      statements.push({ sql: normalized, params });

      if (normalized.startsWith('SELECT value FROM metadata')) {
        const key = String(params?.[0] ?? '');
        const value = metadata.get(key);
        return {
          rows: {
            _array: value === undefined ? [] : [{ value }],
            length: value === undefined ? 0 : 1,
            item: () => undefined,
          },
          rowsAffected: 0,
        } as QueryResult;
      }

      if (normalized.startsWith('INSERT OR REPLACE INTO metadata')) {
        metadata.set(String(params?.[0]), String(params?.[1]));
        return { rowsAffected: 1 } as QueryResult;
      }

      if (normalized.startsWith('PRAGMA table_info(tasks)')) {
        const columns: ColumnInfo[] = [...taskColumns].map(name => ({ name }));
        return {
          rows: {
            _array: columns,
            length: columns.length,
            item: () => undefined,
          },
          rowsAffected: 0,
        } as QueryResult;
      }

      if (normalized.startsWith('ALTER TABLE tasks ADD COLUMN')) {
        const match = normalized.match(/ADD COLUMN (\w+)/i);
        if (match) {
          taskColumns.add(match[1]);
        }
        return { rowsAffected: 0 } as QueryResult;
      }

      if (normalized.startsWith('UPDATE tasks')) {
        const [basePoints, currentPoints, pointsVisible, taskId] = params ?? [];
        const existing = taskPoints.get(String(taskId)) ?? {
          basePoints: 0,
          currentPoints: 0,
          pointsVisible: 1,
        };

        if (existing.basePoints === 0 && existing.currentPoints === 0) {
          taskPoints.set(String(taskId), {
            basePoints: Number(basePoints),
            currentPoints: Number(currentPoints),
            pointsVisible: Number(pointsVisible),
          });
        }

        return { rowsAffected: 1 } as QueryResult;
      }

      // Simulate IF NOT EXISTS: only apply full v2 columns on first create.
      if (
        normalized.includes('CREATE TABLE IF NOT EXISTS tasks') &&
        !tasksTableExists
      ) {
        taskColumns.add('base_points');
        taskColumns.add('current_points');
        taskColumns.add('points_visible');
      }

      return { rowsAffected: 0 } as QueryResult;
    },
  );

  const db = { executeAsync } as unknown as QuickSQLiteConnection;

  return {
    db,
    statements,
    getSchemaVersion: () =>
      Number.parseInt(metadata.get('schema_version') ?? '0', 10),
    getTaskColumns: () => [...taskColumns].sort(),
    getTaskPoints: () => taskPoints,
    seedLegacyTask(taskId: string) {
      taskPoints.set(taskId, {
        basePoints: 0,
        currentPoints: 0,
        pointsVisible: 1,
      });
    },
  };
}

describe('runMigrations task points', () => {
  test('fresh database lands on schema v2 with point columns', async () => {
    const fake = createFakeDb();

    await runMigrations(fake.db);

    expect(fake.getSchemaVersion()).toBe(TARGET_SCHEMA_VERSION);
    expect(fake.getTaskColumns()).toEqual(
      expect.arrayContaining([
        'base_points',
        'current_points',
        'points_visible',
      ]),
    );
  });

  test('upgrades v1 schema by adding point columns and backfilling seed tasks', async () => {
    const fake = createFakeDb({
      initialSchemaVersion: 1,
      initialTaskColumns: ['id', 'game_id', 'title', 'sort_order', 'active'],
    });

    for (const task of defaultTasks) {
      fake.seedLegacyTask(task.id);
    }

    await runMigrations(fake.db);

    expect(fake.getSchemaVersion()).toBe(2);
    expect(fake.getTaskColumns()).toEqual(
      expect.arrayContaining([
        'base_points',
        'current_points',
        'points_visible',
      ]),
    );

    const alterStatements = fake.statements.filter(entry =>
      entry.sql.startsWith('ALTER TABLE tasks ADD COLUMN'),
    );
    expect(alterStatements).toHaveLength(3);

    for (const task of defaultTasks) {
      expect(fake.getTaskPoints().get(task.id)).toEqual({
        basePoints: task.basePoints,
        currentPoints: task.currentPoints,
        pointsVisible: task.pointsVisible ? 1 : 0,
      });
    }
  });

  test('is a no-op for databases already on schema v2', async () => {
    const fake = createFakeDb({
      initialSchemaVersion: 2,
      initialTaskColumns: [
        'id',
        'game_id',
        'title',
        'sort_order',
        'active',
        'base_points',
        'current_points',
        'points_visible',
      ],
    });

    await runMigrations(fake.db);

    expect(fake.getSchemaVersion()).toBe(2);
    expect(
      fake.statements.some(entry =>
        entry.sql.startsWith('ALTER TABLE tasks ADD COLUMN'),
      ),
    ).toBe(false);
    expect(
      fake.statements.some(entry => entry.sql.startsWith('UPDATE tasks')),
    ).toBe(false);
  });

  test('does not overwrite non-zero points during backfill', async () => {
    const fake = createFakeDb({
      initialSchemaVersion: 1,
      initialTaskColumns: [
        'id',
        'game_id',
        'title',
        'sort_order',
        'active',
        'base_points',
        'current_points',
        'points_visible',
      ],
    });

    const customTaskId = defaultTasks[0].id;
    fake.getTaskPoints().set(customTaskId, {
      basePoints: 99,
      currentPoints: 99,
      pointsVisible: 1,
    });

    await runMigrations(fake.db);

    expect(fake.getTaskPoints().get(customTaskId)).toEqual({
      basePoints: 99,
      currentPoints: 99,
      pointsVisible: 1,
    });
  });
});
