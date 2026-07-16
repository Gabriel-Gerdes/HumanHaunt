import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';

import type { Device } from '../domain/types';
import { createId } from '../utils/id';
import { getDb } from './connection';
import { mapDeviceRow, type DeviceRow } from './mappers';
import { rowsToArray } from './query';

export async function ensureDevice(db: QuickSQLiteConnection) {
  const result = await db.executeAsync(
    `
    SELECT id, name, created_at, selected_team_id
    FROM devices
    ORDER BY created_at
    LIMIT 1;
    `,
  );
  const existingDevice = rowsToArray<DeviceRow>(result)[0];

  if (existingDevice) {
    return mapDeviceRow(existingDevice);
  }

  const device: Device = {
    id: createId('device'),
    name: 'This Phone',
    createdAt: Date.now(),
  };

  await db.executeAsync(
    `
    INSERT INTO devices (id, name, created_at, selected_team_id)
    VALUES (?, ?, ?, ?);
    `,
    [device.id, device.name, device.createdAt, null],
  );

  return device;
}

export async function setSelectedTeam(teamId: string) {
  const db = getDb();
  const device = await ensureDevice(db);

  await db.executeAsync(
    'UPDATE devices SET selected_team_id = ? WHERE id = ?;',
    [teamId, device.id],
  );

  return {
    ...device,
    selectedTeamId: teamId,
  };
}
