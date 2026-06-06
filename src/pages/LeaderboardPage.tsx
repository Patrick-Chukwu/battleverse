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

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <h1 className="text-4xl font-black mb-2">Leaderboard 🏆</h1>
          <p className="text-muted-foreground font-semibold">Top players this week</p>
        </motion.div>

        {/* Top 3 podium */}
        <div className="flex justify-center items-end gap-4 mb-10">
          {[1, 0, 2].map((rank) => {
            const player = allPlayers[rank];
            if (!player) return null;
            const isFirst = rank === 0;
            return (
              <motion.div
                key={rank}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: rank * 0.15 }}
                className={`text-center ${isFirst ? "order-2" : rank === 1 ? "order-1" : "order-3"}`}
              >
                <div className={`glass-card rounded-3xl p-4 ${isFirst ? "p-6" : ""} ${player.isYou ? "ring-2 ring-primary" : ""}`}>
                  <span className="text-2xl mb-1 block">{podiumEmoji[rank]}</span>
                  <span className={`${isFirst ? "text-5xl" : "text-4xl"} block mb-2`}>{player.avatar}</span>
                  <p className={`font-black ${isFirst ? "text-lg" : "text-sm"} truncate max-w-[100px]`}>
                    {player.name}{player.isYou ? " (You)" : ""}
                  </p>
                  <p className="text-sm text-primary font-bold">{player.xp} XP</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full list */}
        <div className="space-y-3">
          {allPlayers.slice(3).map((player, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-2xl px-5 py-4 flex items-center gap-4 ${
                player.isYou ? "ring-2 ring-primary" : ""
              }`}
            >
              <span className="text-lg font-black text-muted-foreground w-8">{i + 4}</span>
              <span className="text-2xl">{player.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{player.name}{player.isYou ? " (You)" : ""}</p>
                <p className="text-sm text-muted-foreground">Level {player.level}</p>
              </div>
              <span className="font-black text-primary">{player.xp} XP</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
