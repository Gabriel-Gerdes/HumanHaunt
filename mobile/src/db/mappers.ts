import type { Task } from '../domain/types';

export type TaskRow = {
  id: string;
  game_id: string;
  title: string;
  sort_order: number;
  active: number;
  base_points: number;
  current_points: number;
  points_visible: number;
};

export function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    gameId: row.game_id,
    title: row.title,
    sortOrder: row.sort_order,
    active: row.active === 1,
    basePoints: row.base_points,
    currentPoints: row.current_points,
    pointsVisible: row.points_visible === 1,
  };
}
