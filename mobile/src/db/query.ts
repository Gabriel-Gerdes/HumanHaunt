import type { QueryResult } from 'react-native-quick-sqlite';

export function rowsToArray<T>(result: QueryResult): T[] {
  return (result.rows?._array ?? []) as T[];
}
