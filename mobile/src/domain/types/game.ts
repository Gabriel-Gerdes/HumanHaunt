export type Game = {
  id: string;
  name: string;
  createdAt: number;
};

export type Team = {
  id: string;
  gameId: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type TaskCategory = {
  id: string;
  gameId: string;
  name: string;
  sortOrder: number;
  color: string;
  active: boolean;
  /** System categories (e.g. Completed) are not package-editable in v1. */
  isSystem: boolean;
};

export type Task = {
  id: string;
  gameId: string;
  categoryId: string;
  title: string;
  sortOrder: number;
  active: boolean;
  /** Points when the task was created / last reset to base value. */
  basePoints: number;
  /** Points used for scoring; may rise when unclaimed tasks carry into later phases. */
  currentPoints: number;
  /** When false, player UI may hide exact point values (Phase 5). */
  pointsVisible: boolean;
};
