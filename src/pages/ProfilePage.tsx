import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { defaultProfile, useGameStore } from "@/store/gameStore";
import { badges as badgeCatalog, getLevel } from "@/data/gameData";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileEditDialog } from "@/components/ProfileEditDialog";
import { useSession } from "@/hooks/useSession";
import { isSupabaseConfigured } from "@/lib/flags";

const ProfilePage = () => {
  const profile = useGameStore((s) => s.profile) ?? defaultProfile;
  const { data: session } = useSession();
  const [editOpen, setEditOpen] = useState(false);
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

  const badges = badgeCatalog.map((badge) => ({
    id: badge.id,
    name: badge.name,
    desc: badge.description,
    icon: badge.emoji,
    unlocked: (profile.earnedBadges ?? []).includes(badge.id),
  }));

  return (
    <div className="page-shell bg-background">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-card relative mb-6 overflow-hidden rounded-3xl p-6 text-center sm:mb-8 sm:p-10"
        >
          <div className="relative z-10">
            <div className="relative mb-4 inline-block sm:mb-6">
              <span className="block text-6xl sm:text-8xl">{profile.avatar}</span>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setEditOpen(true)}
                aria-label="Edit profile"
                className="absolute right-0 bottom-0 rounded-xl border border-border bg-card p-2 text-muted-foreground shadow-lg transition-colors hover:text-primary"
              >
                <Pencil className="h-5 w-5" />
              </motion.button>
            </div>

            <h1 className="mb-1 break-words text-2xl font-black sm:text-4xl">
              {profile.name}
            </h1>
            <p className="mb-2 text-base font-bold text-muted-foreground sm:text-xl">
              Level {levelInfo.level} • {levelInfo.title}
            </p>
            {isSupabaseConfigured() && !session ? (
              <p className="mb-8 text-sm font-bold text-muted-foreground">
                Playing as guest.{" "}
                <Link to="/login" className="text-primary underline">
                  Sign in
                </Link>{" "}
                to sync this profile.
              </p>
            ) : (
              <div className="mb-8" />
            )}

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

        <div className="mb-8 grid grid-cols-2 gap-3 sm:mb-12 sm:grid-cols-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: "spring", bounce: 0.35 }}
              className="glass-card rounded-2xl p-4 text-center sm:rounded-3xl sm:p-6"
            >
              <span className="mb-2 block text-3xl sm:text-4xl">{stat.icon}</span>
              <p className={cn("mb-0.5 text-xl font-black sm:text-2xl", stat.color)}>{stat.value}</p>
              <p className="text-sm font-bold text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-black">
            Badges 🏅
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className={cn(
                  "glass-card group rounded-2xl border-2 p-4 text-center transition-all sm:rounded-3xl sm:p-6",
                  badge.unlocked
                    ? "border-game-orange/20 hover:shadow-game"
                    : "border-transparent opacity-60 grayscale"
                )}
              >
                <div className={cn(
                  "mb-3 text-4xl transition-transform duration-300 group-hover:scale-110 sm:mb-4 sm:text-5xl",
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
      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
};

export default ProfilePage;
