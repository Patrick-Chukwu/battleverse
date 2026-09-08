import { motion } from "framer-motion";
import { mockLeaderboard } from "@/data/gameData";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

const podiumEmoji = ["🥇", "🥈", "🥉"];

const LeaderboardPage = () => {
  const { profile } = useGameStore();

  const allPlayers = [
    { name: profile.name, avatar: profile.avatar, xp: profile.xp, level: profile.level, isYou: true },
    ...mockLeaderboard.map(p => ({ ...p, isYou: false })),
  ].sort((a, b) => b.xp - a.xp);

  const top3 = [allPlayers[1], allPlayers[0], allPlayers[2]]; // 2nd, 1st, 3rd

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto max-w-3xl px-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-16 text-center">
          <h1 className="mb-2 text-4xl font-black tracking-tight">Leaderboard 🏆</h1>
          <p className="text-xl font-bold text-muted-foreground">Top players this week</p>
        </motion.div>

        <div className="mb-16 flex items-end justify-center gap-4 sm:gap-8">
          {top3.map((player, idx) => {
            if (!player) return null;
            const rank = idx === 1 ? 0 : idx === 0 ? 1 : 2;
            const isFirst = rank === 0;

            return (
              <motion.div
                key={rank}
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
                    {player.name}{player.isYou ? " (You)" : ""}
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
          {allPlayers.slice(3).map((player, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "glass-card flex items-center gap-6 rounded-3xl p-6 transition-all hover:shadow-game",
                player.isYou && "ring-2 ring-primary bg-primary/5"
              )}
            >
              <span className="w-8 text-2xl font-black text-muted-foreground">{i + 4}</span>
              <span className="text-4xl">{player.avatar}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-black">
                  {player.name}{player.isYou ? " (You)" : ""}
                </p>
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  Level {player.level}
                </p>
              </div>
              <span className="text-2xl font-black text-primary">{player.xp} XP</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
