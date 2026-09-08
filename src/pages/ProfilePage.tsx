import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { getLevel } from "@/data/gameData";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
  const { profile } = useGameStore();
  const levelInfo = getLevel(profile.xp);
  const nextLevelXp = levelInfo.nextLevelXp;
  const progress = levelInfo.progress;
  const accuracy = profile.totalAnswers
    ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100)
    : 0;

  const stats = [
    { label: "Quizzes", value: profile.quizzesCompleted, icon: "📝", color: "text-primary", bg: "bg-primary/10" },
    { label: "Accuracy", value: `${accuracy}%`, icon: "🎯", color: "text-game-green", bg: "bg-game-green/10" },
    { label: "Coins", value: profile.coins, icon: "🪙", color: "text-game-orange", bg: "bg-game-orange/10" },
    { label: "Streak", value: profile.streak, icon: "🔥", color: "text-game-pink", bg: "bg-game-pink/10" },
  ];

  const badges = [
    { id: "first-win", name: "First Victory", desc: "Complete 1 quiz", icon: "🏆", unlocked: true },
    { id: "speed-demon", name: "Speed Demon", desc: "5 fast answers", icon: "⚡", unlocked: false },
    { id: "genius", name: "Genius", desc: "100% score", icon: "🧠", unlocked: false },
    { id: "streak-king", name: "Streak King", desc: "5 correct in a row", icon: "👑", unlocked: false },
    { id: "explorer", name: "Explorer", desc: "Play all subjects", icon: "🧭", unlocked: false },
    { id: "math-whiz", name: "Math Whiz", desc: "Perfect math score", icon: "🔢", unlocked: false },
    { id: "tech-guru", name: "Tech Guru", desc: "Perfect tech score", icon: "💻", unlocked: false },
    { id: "ai-master", name: "AI Master", desc: "Perfect AI score", icon: "🤖", unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-card relative mb-8 overflow-hidden rounded-3xl p-10 text-center"
        >
          <div className="relative z-10">
            <div className="relative mb-6 inline-block">
              <span className="block text-8xl">{profile.avatar}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-0 bottom-0 rounded-xl border border-border bg-card p-2 text-muted-foreground shadow-lg transition-colors hover:text-primary"
              >
                <Pencil className="h-5 w-5" />
              </motion.button>
            </div>

            <h1 className="mb-1 flex items-center justify-center gap-2 text-2xl font-black sm:text-4xl">
              {profile.name}
            </h1>
            <p className="mb-8 text-xl font-bold text-muted-foreground">
              Level {levelInfo.level} • {levelInfo.title}
            </p>

            <div className="mx-auto max-w-md">
              <div className="mb-3 flex justify-between text-sm font-black">
                <span className="text-primary">{profile.xp} XP</span>
                <span className="text-muted-foreground">{nextLevelXp} XP</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-muted shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, type: "spring" }}
                  className="h-full rounded-full bg-primary shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.5 }}
              className="glass-card rounded-3xl p-6 text-center"
            >
              <span className="mb-2 block text-4xl">{stat.icon}</span>
              <p className={cn("mb-0.5 text-2xl font-black", stat.color)}>{stat.value}</p>
              <p className="text-sm font-bold text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-black">
            Badges 🏅
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={cn(
                  "glass-card rounded-3xl border-2 p-6 text-center transition-all group",
                  badge.unlocked
                    ? "border-game-orange/20 hover:shadow-game"
                    : "border-transparent opacity-60 grayscale"
                )}
              >
                <div className={cn(
                  "mb-4 text-5xl transition-transform duration-300 group-hover:scale-110",
                  !badge.unlocked && "blur-[1px]"
                )}>
                  {badge.icon}
                </div>
                <h3 className="mb-1 text-lg font-black">{badge.name}</h3>
                <p className="text-xs font-bold leading-tight text-muted-foreground">{badge.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
