import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerProfile } from '@/data/gameData';
import { getLevel } from '@/data/gameData';

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
      profile: {
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
      },
      setName: (name) => set((s) => ({ profile: { ...s.profile, name } })),
      setAvatar: (avatar) => set((s) => ({ profile: { ...s.profile, avatar } })),
      hydrateFromServer: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      addXp: (amount) => set((s) => {
        const newXp = s.profile.xp + amount;
        return { profile: { ...s.profile, xp: newXp, level: getLevel(newXp).level } };
      }),
      addCoins: (amount) => set((s) => ({ profile: { ...s.profile, coins: s.profile.coins + amount } })),
      incrementStreak: () => set((s) => ({ profile: { ...s.profile, streak: s.profile.streak + 1 } })),
      resetStreak: () => set((s) => ({ profile: { ...s.profile, streak: 0 } })),
      completeQuiz: (correct, total) => set((s) => ({
        profile: {
          ...s.profile,
          quizzesCompleted: s.profile.quizzesCompleted + 1,
          correctAnswers: s.profile.correctAnswers + correct,
          totalAnswers: s.profile.totalAnswers + total,
        },
      })),
      earnBadge: (badgeId) => set((s) => ({
        profile: {
          ...s.profile,
          earnedBadges: s.profile.earnedBadges.includes(badgeId)
            ? s.profile.earnedBadges
            : [...s.profile.earnedBadges, badgeId],
        },
      })),
    }),
    { name: "battleverse-game" }
  )
);
