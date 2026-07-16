import { open, type QuickSQLiteConnection } from 'react-native-quick-sqlite';

const DATABASE_NAME = 'humanhaunt.db';

let dbConnection: QuickSQLiteConnection | undefined;

export function getDb() {
  if (!dbConnection) {
    dbConnection = open({
      name: DATABASE_NAME,
      location: 'default',
    });
  }

  return dbConnection;
}
