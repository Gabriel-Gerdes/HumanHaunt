import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';

import { getClaimsForTask, getWinningClaim } from '../domain/claimResolution';
import { DEFAULT_GAME_ID } from '../domain/seed';
import type { ClaimEvent } from '../domain/types';
import { createId } from '../utils/id';
import { getDb } from './connection';
import { ensureDevice } from './devices';
import { mapClaimEventRow, type ClaimEventRow } from './mappers';
import { rowsToArray } from './query';

export async function getClaimEvents() {
  const db = getDb();
  const result = await db.executeAsync(
    `
    SELECT id, game_id, task_id, team_id, device_id, claimed_at, created_at, received_at, source
    FROM claim_events
    ORDER BY claimed_at, id;
    `,
  );

  return rowsToArray<ClaimEventRow>(result).map(mapClaimEventRow);
}

async function insertClaimEvent(
  db: QuickSQLiteConnection,
  event: ClaimEvent,
) {
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

export async function claimTask(taskId: string, teamId: string) {
  const db = getDb();
  const device = await ensureDevice(db);
  const allClaims = await getClaimEvents();
  const winningClaim = getWinningClaim(getClaimsForTask(allClaims, taskId));

  if (winningClaim) {
    return {
      status: 'already_claimed' as const,
      winningClaim,
    };
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
    status: 'claimed' as const,
    event,
  };
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
