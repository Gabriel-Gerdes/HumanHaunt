export type Device = {
  id: string;
  name: string;
  createdAt: number;
  /** Local player's chosen team; claims use this team id. */
  selectedTeamId?: string;
};
