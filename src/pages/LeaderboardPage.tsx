import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { mockLeaderboard } from "@/data/gameData";
import { defaultProfile, useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { buildLeaderboardView, podiumOrder, type LeaderboardEntry, type LeaderboardPayload } from "@/lib/leaderboard";
import { fetchLeaderboard } from "@/lib/leaderboard-api";
import { isServerLeaderboardEnabled } from "@/lib/flags";
import { useSession } from "@/hooks/useSession";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const podiumEmoji = ["🥇", "🥈", "🥉"];

function mockPayload(you: { name: string; avatar: string; xp: number; level: number } | null): LeaderboardPayload {
  const rows = mockLeaderboard.map((p, i) => ({
    id: `mock-${p.name}`,
    username: p.name,
    avatar: p.avatar,
    xp: p.xp,
    level: p.level,
    rank: i + 1,
  }));
  return {
    rows,
    you: you
      ? { id: "local-you", username: you.name, avatar: you.avatar, xp: you.xp, level: you.level, rank: 0 }
      : null,
    captured_at: new Date().toISOString(),
  };
}

function mergeMockYou(payload: LeaderboardPayload): LeaderboardPayload {
  if (!payload.you) return payload;
  const combined = [
    ...payload.rows.map((row) => ({ ...row, id: row.id })),
    payload.you,
  ].sort((a, b) => b.xp - a.xp || a.username.localeCompare(b.username));
  const ranked = combined.map((row, i) => ({ ...row, rank: i + 1 }));
  const you = ranked.find((row) => row.id === payload.you?.id) ?? null;
  return { rows: ranked, you, captured_at: payload.captured_at };
}

const LeaderboardPage = () => {
  const profile = useGameStore((s) => s.profile) ?? defaultProfile;
  const { data: session } = useSession();
  const online = useOnlineStatus();
  const serverOn = isServerLeaderboardEnabled();
  const signedIn = Boolean(session);

  const query = useQuery({
    queryKey: ["leaderboard", session?.user.id ?? "guest"],
    queryFn: () => fetchLeaderboard(50),
    enabled: serverOn,
    staleTime: 30_000,
  });

  // Flag off: keep the old demo board, including local "You". Flag on: never insert guest XP.
  const payload = serverOn
    ? query.data
    : mergeMockYou(mockPayload({
        name: profile.name,
        avatar: profile.avatar,
        xp: profile.xp,
        level: profile.level,
      }));

  const allPlayers: LeaderboardEntry[] = payload ? buildLeaderboardView(payload) : [];
  const top3 = podiumOrder(allPlayers);
  const stale = serverOn && !online && Boolean(query.data);

  return (
    <div className="page-shell bg-background">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 text-center sm:mb-16">
          <h1 className="text-title mb-2 font-black tracking-tight">Leaderboard 🏆</h1>
          <p className="text-base font-bold text-muted-foreground sm:text-xl">
            {serverOn ? "Top players by server XP" : "Top players this week"}
          </p>
          {stale && (
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Showing the last saved board (you are offline).
            </p>
          )}
          {serverOn && !signedIn && (
            <p className="mt-3 text-sm font-bold text-muted-foreground">
              Guests do not rank.{" "}
              <Link to="/login" className="text-primary underline">
                Sign in
              </Link>{" "}
              to join the board.
            </p>
          )}
        </motion.div>

        {serverOn && query.isLoading && (
          <p className="mb-10 text-center text-lg font-black text-muted-foreground">Loading ranks…</p>
        )}

        {serverOn && query.isError && !query.data && (
          <p className="mb-10 text-center font-bold text-destructive">
            {query.error instanceof Error ? query.error.message : "Could not load the leaderboard."}
          </p>
        )}

        {allPlayers.length > 0 && (
          <>
            <div className="mb-8 flex items-end justify-center gap-2 sm:mb-16 sm:gap-8">
              {top3.map((player, idx) => {
                if (!player) return null;
                const rank = idx === 1 ? 0 : idx === 0 ? 1 : 2;
                const isFirst = rank === 0;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: rank * 0.1, type: "spring", bounce: 0.35 }}
                    className="min-w-0 max-w-[180px] flex-1 text-center"
                  >
                    <div className={cn(
                      "glass-card relative rounded-2xl p-3 transition-all sm:rounded-3xl sm:p-6",
                      isFirst && "border border-primary/20 sm:scale-110 sm:-translate-y-4",
                      player.isYou && "ring-2 ring-primary ring-offset-2 ring-offset-background sm:ring-4 sm:ring-offset-4"
                    )}>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg sm:-top-4 sm:text-2xl">
                        {podiumEmoji[rank]}
                      </div>
                      <span className={cn("mb-2 block sm:mb-3", isFirst ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl")}>
                        {player.avatar}
                      </span>
                      <p className="mb-1 truncate text-xs font-black sm:text-base">
                        {player.username}{player.isYou ? " (You)" : ""}
                      </p>
                      <p className="text-sm font-black text-primary sm:text-lg">
                        {player.xp} XP
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {allPlayers.slice(3).map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={cn(
                    "glass-card flex items-center gap-3 rounded-2xl p-3 transition-all hover:shadow-game sm:gap-6 sm:rounded-3xl sm:p-6",
                    player.isYou && "ring-2 ring-primary bg-primary/5"
                  )}
                >
                  <span className="w-6 text-lg font-black text-muted-foreground sm:w-8 sm:text-2xl">{player.rank}</span>
                  <span className="text-2xl sm:text-4xl">{player.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black sm:text-xl">
                      {player.username}{player.isYou ? " (You)" : ""}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-muted-foreground sm:mt-1 sm:text-sm">
                      Level {player.level}
                    </p>
                  </div>
                  <span className="shrink-0 text-base font-black text-primary sm:text-2xl">{player.xp} XP</span>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {serverOn && query.data && allPlayers.length === 0 && (
          <p className="text-center font-bold text-muted-foreground">
            No ranked players yet. Finish a signed-in quiz or battle to appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
