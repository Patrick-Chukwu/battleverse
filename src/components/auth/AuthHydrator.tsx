import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { isServerProfileEnabled } from "@/lib/flags";
import { getSupabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";

/** Copies the signed-in server profile into Zustand (optimistic UI / navbar). */
export function AuthHydrator() {
  const { data: profile } = useProfile();
  const hydrateFromServer = useGameStore((s) => s.hydrateFromServer);

  useEffect(() => {
    if (!isServerProfileEnabled() || !profile) return;

    void (async () => {
      const supabase = getSupabase();
      let earnedBadges: string[] = [];
      if (supabase) {
        const { data } = await supabase.from("user_badges").select("badge_id");
        earnedBadges = (data ?? []).map((row) => row.badge_id as string);
      }
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
        earnedBadges,
      });
    })();
  }, [hydrateFromServer, profile]);

  return null;
}
