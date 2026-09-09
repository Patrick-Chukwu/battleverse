import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerProfile } from "@/data/gameData";
import { getLevel } from "@/data/gameData";

export const defaultProfile: PlayerProfile = {
  name: "Player",
  avatar: "🦊",
  xp: 0,
  level: 1,
  coins: 0,
  streak: 0,
  earnedBadges: [],
  quizzesCompleted: 0,
  correctAnswers: 0,
  totalAnswers: 0,
};

export function normalizeProfile(value: unknown): PlayerProfile {
  const p = value && typeof value === "object" ? (value as Partial<PlayerProfile>) : {};
  const num = (n: unknown, fallback: number) => (typeof n === "number" && Number.isFinite(n) ? n : fallback);
  return {
    name: typeof p.name === "string" && p.name.trim() ? p.name : defaultProfile.name,
    avatar: typeof p.avatar === "string" && p.avatar ? p.avatar : defaultProfile.avatar,
    xp: num(p.xp, defaultProfile.xp),
    level: num(p.level, defaultProfile.level),
    coins: num(p.coins, defaultProfile.coins),
    streak: num(p.streak, defaultProfile.streak),
    earnedBadges: Array.isArray(p.earnedBadges)
      ? p.earnedBadges.filter((id): id is string => typeof id === "string")
      : [],
    quizzesCompleted: num(p.quizzesCompleted, defaultProfile.quizzesCompleted),
    correctAnswers: num(p.correctAnswers, defaultProfile.correctAnswers),
    totalAnswers: num(p.totalAnswers, defaultProfile.totalAnswers),
  };
}

interface GameState {
  profile: PlayerProfile;
  setName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  hydrateFromServer: (patch: Partial<PlayerProfile>) => void;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  completeQuiz: (correct: number, total: number) => void;
  earnBadge: (badgeId: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      setName: (name) => set((s) => ({ profile: normalizeProfile({ ...s.profile, name }) })),
      setAvatar: (avatar) => set((s) => ({ profile: normalizeProfile({ ...s.profile, avatar }) })),
      hydrateFromServer: (patch) =>
        set((s) => ({ profile: normalizeProfile({ ...s.profile, ...patch }) })),
      addXp: (amount) =>
        set((s) => {
          const profile = normalizeProfile(s.profile);
          const newXp = profile.xp + amount;
          return { profile: { ...profile, xp: newXp, level: getLevel(newXp).level } };
        }),
      addCoins: (amount) =>
        set((s) => {
          const profile = normalizeProfile(s.profile);
          return { profile: { ...profile, coins: profile.coins + amount } };
        }),
      incrementStreak: () =>
        set((s) => {
          const profile = normalizeProfile(s.profile);
          return { profile: { ...profile, streak: profile.streak + 1 } };
        }),
      resetStreak: () =>
        set((s) => ({ profile: { ...normalizeProfile(s.profile), streak: 0 } })),
      completeQuiz: (correct, total) =>
        set((s) => {
          const profile = normalizeProfile(s.profile);
          return {
            profile: {
              ...profile,
              quizzesCompleted: profile.quizzesCompleted + 1,
              correctAnswers: profile.correctAnswers + correct,
              totalAnswers: profile.totalAnswers + total,
            },
          };
        }),
      earnBadge: (badgeId) =>
        set((s) => {
          const profile = normalizeProfile(s.profile);
          return {
            profile: {
              ...profile,
              earnedBadges: profile.earnedBadges.includes(badgeId)
                ? profile.earnedBadges
                : [...profile.earnedBadges, badgeId],
            },
          };
        }),
    }),
    {
      name: "battleverse-game",
      merge: (persisted, current) => {
        const incoming = persisted && typeof persisted === "object" ? (persisted as Partial<GameState>) : {};
        return {
          ...current,
          ...incoming,
          profile: normalizeProfile(incoming.profile),
        };
      },
    }
  )
);
