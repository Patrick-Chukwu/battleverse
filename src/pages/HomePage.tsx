import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FloatingIcons } from "@/components/FloatingIcons";
import { subjects } from "@/data/quizData";
import { defaultProfile, useGameStore } from "@/store/gameStore";
import { getLevel } from "@/data/gameData";
import { Swords, BookOpen, ArrowRight, ClipboardList } from "lucide-react";
import { isExamModesEnabled, isSupabaseConfigured } from "@/lib/flags";
import { cn } from "@/lib/utils";

const subjectHover: Record<string, string> = {
  "game-blue": "hover:border-game-blue/30",
  "game-purple": "hover:border-game-purple/30",
  "game-orange": "hover:border-game-orange/30",
  "game-green": "hover:border-game-green/30",
};

const HomePage = () => {
  const navigate = useNavigate();
  const showExams = isExamModesEnabled();
  const backendReady = isSupabaseConfigured();
  const profile = useGameStore((s) => s.profile) ?? defaultProfile;
  const levelInfo = getLevel(profile.xp);

  const stats = [
    { value: profile.xp, label: "Total XP", className: "text-primary" },
    { value: levelInfo.title, label: `Level ${levelInfo.level}`, className: "text-game-orange" },
    { value: profile.quizzesCompleted, label: "Quizzes Done", className: "text-game-green" },
    { value: `🔥 ${profile.streak}`, label: "Streak", className: "text-game-pink" },
  ];

  return (
    <div className="page-offset bg-background">
      {!backendReady && (
        <div className="relative z-30 border-b border-border bg-card/95 px-4 py-3 text-center text-sm font-bold text-muted-foreground">
          This deploy has no Supabase keys, so it is guest-only (local quizzes, mock leaderboard, no sign-in).
          Set <code className="font-black text-foreground">VITE_SUPABASE_URL</code> and{" "}
          <code className="font-black text-foreground">VITE_SUPABASE_ANON_KEY</code> on Vercel, then Redeploy.
        </div>
      )}
      <section className="relative flex min-h-[min(70dvh,36rem)] items-center justify-center overflow-hidden px-4 py-10 sm:min-h-[75vh] sm:py-16">
        <FloatingIcons />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.35 }}
            className="mb-4 text-5xl sm:mb-6 sm:text-7xl"
          >
            🚀
          </motion.div>

          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-display mb-3 font-black tracking-tight sm:mb-4"
          >
            Welcome to{" "}
            <span className="text-primary">Battleverse</span>
          </motion.h1>

          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-lg font-bold text-muted-foreground sm:mb-10 sm:text-2xl"
          >
            Learn. Play. Compete. 🎯
          </motion.p>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/battle")}
              className="animate-pulse-glow group flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-black text-primary-foreground shadow-lg transition-all hover:shadow-xl sm:px-8 sm:text-lg"
            >
              <Swords className="h-5 w-5 sm:h-6 sm:w-6" />
              Start Battle
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/subjects")}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-4 text-base font-black text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 sm:px-8 sm:text-lg"
            >
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              Practice Solo
            </motion.button>
            {(showExams || !backendReady) && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/exams")}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-4 text-base font-black text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 sm:px-8 sm:text-lg"
              >
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" />
                Exam papers
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 container mx-auto -mt-6 px-4 sm:-mt-12"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-4 text-center sm:rounded-3xl sm:p-6"
            >
              <p className={cn("truncate text-xl font-black sm:text-3xl", stat.className)}>{stat.value}</p>
              <p className="mt-1 text-xs font-bold text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="container mx-auto px-4 py-12 sm:py-24">
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 text-center sm:mb-16"
        >
          <h2 className="text-title mb-2 text-center font-black">
            Choose Your Arena ⚔️
          </h2>
          <p className="text-base font-bold text-muted-foreground sm:text-lg">Pick a subject and start your quest</p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {subjects.map((subject, i) => (
            <motion.button
              key={subject.id}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/quiz/${subject.id}`)}
              className={cn(
                "glass-card group cursor-pointer rounded-3xl border-2 border-transparent p-5 text-left transition-all sm:p-6",
                subjectHover[subject.color]
              )}
            >
              <div className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110 sm:mb-4 sm:text-5xl">
                {subject.emoji}
              </div>
              <h3 className="mb-1 text-lg font-black">{subject.name}</h3>
              <p className="mb-4 text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">{subject.description}</p>
              <div className="flex items-center gap-2 text-sm font-black text-primary">
                Play Now <ArrowRight className="h-4 w-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8 sm:pb-24">
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-3xl bg-primary p-8 text-center shadow-2xl shadow-primary/20 sm:p-20"
        >
          <div className="relative z-10">
            <h2 className="text-title mb-3 font-black text-primary-foreground">Level Up Your Brain with Highfrica</h2>
            <p className="mb-8 text-base font-bold text-primary-foreground/80 sm:mb-10 sm:text-2xl">The best place to learn and play for kids</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.open("https://highfrica.com", "_blank", "noopener,noreferrer")}
              className="min-h-12 rounded-2xl bg-card px-8 py-3 font-black text-foreground shadow-lg transition-all"
            >
              Start Learning Now
            </motion.button>
          </div>

          <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-32 -ml-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
