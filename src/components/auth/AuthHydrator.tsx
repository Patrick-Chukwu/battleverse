import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { isServerProfileEnabled } from "@/lib/flags";
import { useGameStore } from "@/store/gameStore";

/** Copies the signed-in server profile into Zustand (optimistic UI / navbar). */
export function AuthHydrator() {
  const { data: profile } = useProfile();
  const hydrateFromServer = useGameStore((s) => s.hydrateFromServer);

  useEffect(() => {
    if (!isServerProfileEnabled() || !profile) return;
    hydrateFromServer({
      name: profile.username,
      avatar: profile.avatar,
      xp: profile.xp,
      level: profile.level,
      coins: profile.coins,
      streak: profile.streak,
      quizzesCompleted: profile.quizzes_completed,
      correctAnswers: profile.correct_answers,
      totalAnswers: profile.total_answers,
    });
  }, [hydrateFromServer, profile]);

  return null;
}
