import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';

import {
  createSchema,
  dropAllTables,
  getSchemaVersion,
  SCHEMA_VERSION,
  setSchemaVersion,
} from './schema';

/**
 * Ensures the database matches the current schema.
 * Fresh and outdated databases are built from scratch.
 */
export async function runMigrations(db: QuickSQLiteConnection) {
  const version = await getSchemaVersion(db);

  if (version === SCHEMA_VERSION) {
    return;
  }

  if (version > 0) {
    await dropAllTables(db);
  }

  await createSchema(db);
  await setSchemaVersion(db, SCHEMA_VERSION);
}
