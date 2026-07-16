import type {
  ClaimEvent,
  Device,
  Game,
  Task,
  TaskCategory,
  Team,
} from '../domain/types';

export type GameRow = {
  id: string;
  name: string;
  created_at: number;
};

export type TeamRow = {
  id: string;
  game_id: string;
  name: string;
  color: string;
  sort_order: number;
};

export type TaskCategoryRow = {
  id: string;
  game_id: string;
  name: string;
  sort_order: number;
  color: string;
  active: number;
  is_system: number;
};

export type TaskRow = {
  id: string;
  game_id: string;
  category_id: string;
  title: string;
  sort_order: number;
  active: number;
  base_points: number;
  current_points: number;
  points_visible: number;
};

export type DeviceRow = {
  id: string;
  name: string;
  created_at: number;
  selected_team_id?: string | null;
};

export type ClaimEventRow = {
  id: string;
  game_id: string;
  task_id: string;
  team_id: string;
  device_id: string;
  claimed_at: number;
  created_at: number;
  received_at: number;
  source: ClaimEvent['source'];
};

export function mapGameRow(row: GameRow): Game {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function mapTeamRow(row: TeamRow): Team {
  return {
    id: row.id,
    gameId: row.game_id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

export function mapTaskCategoryRow(row: TaskCategoryRow): TaskCategory {
  return {
    id: row.id,
    gameId: row.game_id,
    name: row.name,
    sortOrder: row.sort_order,
    color: row.color,
    active: row.active === 1,
    isSystem: row.is_system === 1,
  };
}

export function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    gameId: row.game_id,
    categoryId: row.category_id,
    title: row.title,
    sortOrder: row.sort_order,
    active: row.active === 1,
    basePoints: row.base_points,
    currentPoints: row.current_points,
    pointsVisible: row.points_visible === 1,
  };
}

export function mapDeviceRow(row: DeviceRow): Device {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    selectedTeamId: row.selected_team_id ?? undefined,
  };
}

export function mapClaimEventRow(row: ClaimEventRow): ClaimEvent {
  return {
    id: row.id,
    gameId: row.game_id,
    taskId: row.task_id,
    teamId: row.team_id,
    deviceId: row.device_id,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    receivedAt: row.received_at,
    source: row.source,
  };
}
