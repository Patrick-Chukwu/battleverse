import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { getLevel } from "@/data/gameData";
import { Pencil } from "lucide-react";

const ProfilePage = () => {
  const { profile } = useGameStore();
  const levelInfo = getLevel(profile.xp);
  const nextLevelXp = (levelInfo.level + 1) * 1000; // Simplified for UI
  const progress = (profile.xp / nextLevelXp) * 100;

  const stats = [
    { label: "Quizzes", value: profile.quizzesCompleted, icon: "📝", color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Accuracy", value: "94%", icon: "🎯", color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Coins", value: profile.coins, icon: "🪙", color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Streak", value: profile.streak, icon: "🔥", color: "text-rose-500", bg: "bg-rose-50" },
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
    <div className="min-h-screen pt-24 pb-16 bg-[#F8F9FA]">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Profile Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[3rem] p-10 mb-8 text-center shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="relative inline-block mb-6">
              <span className="text-8xl block">{profile.avatar}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-0 right-0 bg-white p-2 rounded-xl shadow-lg border border-gray-100 text-gray-400 hover:text-primary transition-colors"
              >
                <Pencil className="w-5 h-5" />
              </motion.button>
            </div>
            
            <h1 className="text-4xl font-black mb-1 text-gray-900 flex items-center justify-center gap-2">
              {profile.name}
            </h1>
            <p className="text-xl text-gray-400 font-bold mb-8">
              Level {levelInfo.level} • {levelInfo.title}
            </p>

            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm font-black uppercase tracking-widest mb-3">
                <span className="text-primary">{profile.xp} XP</span>
                <span className="text-gray-300">{nextLevelXp} XP</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, type: "spring" }}
                  className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                />
              </div>
            </div>
          </div>
          
          {/* Decorative background */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-indigo-300" />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.5 }}
              className="bg-white rounded-[2rem] p-6 text-center shadow-sm border border-gray-100"
            >
              <span className="text-4xl block mb-2">{stat.icon}</span>
              <p className={cn("text-2xl font-black mb-0.5", stat.color)}>{stat.value}</p>
              <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Badges Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-8 text-gray-900 flex items-center gap-3">
            Badges <span className="text-2xl">🏅</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={cn(
                  "bg-white rounded-[2rem] p-6 text-center border-2 transition-all group",
                  badge.unlocked 
                    ? "border-amber-100 shadow-md hover:shadow-xl" 
                    : "border-gray-50 opacity-60 grayscale"
                )}
              >
                <div className={cn(
                  "text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300",
                  !badge.unlocked && "blur-[1px]"
                )}>
                  {badge.icon}
                </div>
                <h3 className="text-lg font-black mb-1 text-gray-900">{badge.name}</h3>
                <p className="text-xs text-gray-400 font-bold leading-tight">{badge.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

export default ProfilePage;
