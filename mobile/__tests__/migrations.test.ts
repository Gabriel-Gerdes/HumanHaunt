import type { QueryResult, QuickSQLiteConnection } from 'react-native-quick-sqlite';

import { runMigrations } from '../src/db/migrate';
import { createSchema, SCHEMA_VERSION } from '../src/db/schema';

type FakeDb = {
  db: QuickSQLiteConnection;
  statements: string[];
  metadata: Map<string, string>;
  tables: Set<string>;
};

function createFakeDb(initialVersion?: number): FakeDb {
  const metadata = new Map<string, string>();
  const tables = new Set<string>();
  const statements: string[] = [];

  if (initialVersion !== undefined && initialVersion > 0) {
    metadata.set('schema_version', String(initialVersion));
    tables.add('metadata');
  }

  const executeAsync = jest.fn(
    async (sql: string, params?: unknown[]): Promise<QueryResult> => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      statements.push(normalized);

      if (normalized.startsWith('SELECT value FROM metadata')) {
        if (!tables.has('metadata')) {
          throw new Error('no such table: metadata');
        }

        const key = String(params?.[0] ?? '');
        const value = metadata.get(key);
        return {
          rows: {
            _array: value === undefined ? [] : [{ value }],
            length: value === undefined ? 0 : 1,
            item: (i: number) =>
              value === undefined || i !== 0 ? undefined : [{ value }][0],
          },
          rowsAffected: 0,
        } as QueryResult;
      }

      if (normalized.startsWith('INSERT OR REPLACE INTO metadata')) {
        metadata.set(String(params?.[0]), String(params?.[1]));
        return { rowsAffected: 1 } as QueryResult;
      }

      if (normalized.startsWith('DROP TABLE IF EXISTS')) {
        const match = normalized.match(/DROP TABLE IF EXISTS (\w+)/i);
        if (match) {
          tables.delete(match[1]);
          if (match[1] === 'metadata') {
            metadata.clear();
          }
        }
        return { rowsAffected: 0 } as QueryResult;
      }

      if (normalized.startsWith('CREATE TABLE')) {
        const match = normalized.match(/CREATE TABLE (\w+)/i);
        if (match) {
          tables.add(match[1]);
        }
        return { rowsAffected: 0 } as QueryResult;
      }

      return { rowsAffected: 0 } as QueryResult;
    },
  );

  return {
    db: { executeAsync } as unknown as QuickSQLiteConnection,
    statements,
    metadata,
    tables,
  };
}

describe('createSchema', () => {
  test('creates the current tables from scratch', async () => {
    const fake = createFakeDb();

    await createSchema(fake.db);

    expect(fake.tables.has('tasks')).toBe(true);
    expect(fake.tables.has('task_categories')).toBe(true);
    expect(fake.tables.has('devices')).toBe(true);
    expect(fake.tables.has('claim_events')).toBe(true);

    const createStatements = fake.statements.filter(sql =>
      sql.startsWith('CREATE TABLE'),
    );
    expect(createStatements.some(sql => sql.includes('base_points'))).toBe(
      true,
    );
    expect(createStatements.some(sql => sql.includes('selected_team_id'))).toBe(
      true,
    );
    expect(createStatements.some(sql => sql.includes('category_id'))).toBe(
      true,
    );
  });
});

describe('runMigrations', () => {
  test('builds a fresh database at the current schema version', async () => {
    const fake = createFakeDb();

    await runMigrations(fake.db);

    expect(fake.metadata.get('schema_version')).toBe(String(SCHEMA_VERSION));
    expect(fake.tables.has('tasks')).toBe(true);
    expect(fake.tables.has('devices')).toBe(true);
    expect(fake.statements.some(sql => sql.startsWith('DROP TABLE'))).toBe(
      false,
    );
  });

  test('rebuilds from scratch when the stored version is outdated', async () => {
    const fake = createFakeDb(Math.max(1, SCHEMA_VERSION - 1));
    fake.tables.add('tasks');
    fake.tables.add('devices');

    await runMigrations(fake.db);

    expect(fake.statements.some(sql => sql.startsWith('DROP TABLE'))).toBe(
      true,
    );
    expect(fake.metadata.get('schema_version')).toBe(String(SCHEMA_VERSION));
    expect(fake.tables.has('tasks')).toBe(true);
    expect(fake.tables.has('devices')).toBe(true);
  });

  test('rebuilds and downgrades the version when the stored schema is newer than supported', async () => {
    // Simulates an app downgrade: the on-disk schema was written by a newer
    // build. runMigrations must not silently keep potentially incompatible
    // tables; it rebuilds from scratch and pins the recorded version back to
    // SCHEMA_VERSION.
    const fake = createFakeDb(SCHEMA_VERSION + 1);
    fake.tables.add('tasks');
    fake.tables.add('devices');

    await runMigrations(fake.db);

    expect(fake.statements.some(sql => sql.startsWith('DROP TABLE'))).toBe(
      true,
    );
    expect(fake.statements.some(sql => sql.startsWith('CREATE TABLE'))).toBe(
      true,
    );
    expect(fake.metadata.get('schema_version')).toBe(String(SCHEMA_VERSION));
    expect(fake.tables.has('tasks')).toBe(true);
    expect(fake.tables.has('devices')).toBe(true);
  });

  test('is a no-op when the schema is already current', async () => {
    const fake = createFakeDb(SCHEMA_VERSION);
    fake.tables.add('tasks');

    await runMigrations(fake.db);

    expect(fake.statements.some(sql => sql.startsWith('CREATE TABLE'))).toBe(
      false,
    );
    expect(fake.statements.some(sql => sql.startsWith('DROP TABLE'))).toBe(
      false,
    );
    expect(fake.metadata.get('schema_version')).toBe(String(SCHEMA_VERSION));
  });
});
