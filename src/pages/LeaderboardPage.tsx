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
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto max-w-3xl px-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-16 text-center">
          <h1 className="mb-2 text-4xl font-black tracking-tight">Leaderboard 🏆</h1>
          <p className="text-xl font-bold text-muted-foreground">
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
            <div className="mb-16 flex items-end justify-center gap-4 sm:gap-8">
              {top3.map((player, idx) => {
                if (!player) return null;
                const rank = idx === 1 ? 0 : idx === 0 ? 1 : 2;
                const isFirst = rank === 0;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: rank * 0.15, type: "spring", bounce: 0.5 }}
                    className="max-w-[180px] flex-1 text-center"
                  >
                    <div className={cn(
                      "glass-card relative rounded-3xl p-6 transition-all",
                      isFirst && "scale-110 -translate-y-4 border border-primary/20",
                      player.isYou && "ring-4 ring-primary ring-offset-4 ring-offset-background"
                    )}>
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">
                        {podiumEmoji[rank]}
                      </div>
                      <span className={cn("mb-3 block", isFirst ? "text-6xl" : "text-5xl")}>
                        {player.avatar}
                      </span>
                      <p className="mb-1 truncate font-black">
                        {player.username}{player.isYou ? " (You)" : ""}
                      </p>
                      <p className="text-lg font-black text-primary">
                        {player.xp} XP
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="space-y-4">
              {allPlayers.slice(3).map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={cn(
                    "glass-card flex items-center gap-6 rounded-3xl p-6 transition-all hover:shadow-game",
                    player.isYou && "ring-2 ring-primary bg-primary/5"
                  )}
                >
                  <span className="w-8 text-2xl font-black text-muted-foreground">{player.rank}</span>
                  <span className="text-4xl">{player.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xl font-black">
                      {player.username}{player.isYou ? " (You)" : ""}
                    </p>
                    <p className="mt-1 text-sm font-bold text-muted-foreground">
                      Level {player.level}
                    </p>
                  </div>
                  <span className="text-2xl font-black text-primary">{player.xp} XP</span>
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
