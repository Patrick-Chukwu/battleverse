export type AgeBand = "6-8" | "9-12" | "13-16" | "16plus";
export type UserRole = "player" | "admin";
export type BattleStatus = "waiting" | "active" | "complete" | "forfeit";
export type InviteStatus = "pending" | "accepted" | "declined" | "expired" | "queued_offline";
export type PresenceStatus = "online" | "idle" | "in_battle" | "offline";
export type BattleMode = "matchmaking" | "challenge";

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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; username: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: Pick<
          ProfileRow,
          "id" | "username" | "avatar" | "xp" | "level" | "age_band" | "discoverable"
        >;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      age_band: AgeBand;
      user_role: UserRole;
    };
  };
};
