export type AgeBand = "6-8" | "9-12" | "13-16" | "16plus";
export type UserRole = "player" | "admin";

export interface ProfileRow {
  id: string;
  username: string;
  avatar: string;
  age_band: AgeBand | null;
  discoverable: boolean;
  phone_hash: string | null;
  email_hash: string | null;
  role: UserRole;
  xp: number;
  coins: number;
  level: number;
  streak: number;
  quizzes_completed: number;
  correct_answers: number;
  total_answers: number;
  parent_email: string | null;
  updated_at: string;
}

export interface ProfileUpdate {
  username?: string;
  avatar?: string;
  age_band?: AgeBand | null;
  discoverable?: boolean;
}
