export interface LeaderboardRow {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  rank: number;
}

export interface LeaderboardEntry extends LeaderboardRow {
  isYou: boolean;
}

export interface LeaderboardPayload {
  rows: LeaderboardRow[];
  you: LeaderboardRow | null;
  captured_at: string;
}

/** Guests pass `you = null` so local XP never appears on the global board. */
export function buildLeaderboardView(payload: LeaderboardPayload): LeaderboardEntry[] {
  const youId = payload.you?.id ?? null;
  const entries: LeaderboardEntry[] = payload.rows.map((row) => ({
    ...row,
    isYou: youId !== null && row.id === youId,
  }));

  if (payload.you && !entries.some((row) => row.id === payload.you?.id)) {
    entries.push({ ...payload.you, isYou: true });
  }

  return entries;
}

export function podiumOrder<T>(players: T[]): [T | undefined, T | undefined, T | undefined] {
  return [players[1], players[0], players[2]];
}
