import { motion } from "framer-motion";
import { mockLeaderboard } from "@/data/gameData";
import { useGameStore } from "@/store/gameStore";

const podiumEmoji = ["🥇", "🥈", "🥉"];

const LeaderboardPage = () => {
  const { profile } = useGameStore();

  const allPlayers = [
    { name: profile.name, avatar: profile.avatar, xp: profile.xp, level: profile.level, isYou: true },
    ...mockLeaderboard.map(p => ({ ...p, isYou: false })),
  ].sort((a, b) => b.xp - a.xp);

  const top3 = [allPlayers[1], allPlayers[0], allPlayers[2]]; // 2nd, 1st, 3rd

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#F8F9FA]">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-16">
          <h1 className="text-5xl font-black mb-3 text-gray-900 tracking-tight">Leaderboard 🏆</h1>
          <p className="text-xl text-gray-500 font-bold">Top players this week</p>
        </motion.div>

        {/* Top 3 podium */}
        <div className="flex justify-center items-end gap-4 sm:gap-8 mb-16">
          {top3.map((player, idx) => {
            if (!player) return null;
            const rank = idx === 1 ? 0 : idx === 0 ? 1 : 2; // idx 1 is 1st, 0 is 2nd, 2 is 3rd
            const isFirst = rank === 0;
            
            return (
              <motion.div
                key={rank}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: rank * 0.15, type: "spring", bounce: 0.5 }}
                className="text-center flex-1 max-w-[180px]"
              >
                <div className={cn(
                  "bg-white rounded-[2rem] p-6 shadow-xl relative transition-all border border-gray-100",
                  isFirst ? "scale-110 -translate-y-4 shadow-indigo-500/10 border-primary/20" : "shadow-gray-200/50",
                  player.isYou && "ring-4 ring-primary ring-offset-4"
                )}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">
                    {podiumEmoji[rank]}
                  </div>
                  <span className={cn("block mb-3", isFirst ? "text-6xl" : "text-5xl")}>
                    {player.avatar}
                  </span>
                  <p className="font-black text-gray-900 truncate mb-1">
                    {player.name}{player.isYou ? " (You)" : ""}
                  </p>
                  <p className="font-black text-primary text-lg">
                    {player.xp} XP
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full list */}
        <div className="space-y-4">
          {allPlayers.slice(3).map((player, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bg-white rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all border border-gray-100",
                player.isYou && "ring-2 ring-primary bg-indigo-50/30"
              )}
            >
              <span className="text-2xl font-black text-gray-300 w-8">{i + 4}</span>
              <span className="text-4xl">{player.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-black text-gray-900 truncate">
                  {player.name}{player.isYou ? " (You)" : ""}
                </p>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-xs mt-1">
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

// Simple cn helper since we can't import easily sometimes or to be safe
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

export default LeaderboardPage;
