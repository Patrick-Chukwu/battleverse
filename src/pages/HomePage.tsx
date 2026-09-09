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
    <div className="min-h-screen bg-background pt-[66px]">
      {!backendReady && (
        <div className="relative z-30 border-b border-border bg-card/95 px-4 py-3 text-center text-sm font-bold text-muted-foreground">
          This deploy has no Supabase keys, so it is guest-only (local quizzes, mock leaderboard, no sign-in).
          Set <code className="font-black text-foreground">VITE_SUPABASE_URL</code> and{" "}
          <code className="font-black text-foreground">VITE_SUPABASE_ANON_KEY</code> on Vercel, then Redeploy.
        </div>
      )}
      <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden">
        <FloatingIcons />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
            className="mb-6 text-7xl"
          >
            🚀
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-5xl font-black tracking-tight sm:text-7xl"
          >
            Welcome to{" "}
            <span className="text-primary">Battleverse</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-10 text-xl font-bold text-muted-foreground sm:text-2xl"
          >
            Learn. Play. Compete. 🎯
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col justify-center gap-4 sm:flex-row"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/battle")}
              className="animate-pulse-glow group flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-black text-primary-foreground shadow-lg transition-all hover:shadow-xl"
            >
              <Swords className="h-6 w-6" />
              Start Battle
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/subjects")}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-8 py-4 text-lg font-black text-foreground transition-all hover:border-primary/30 hover:bg-primary/5"
            >
              <BookOpen className="h-6 w-6" />
              Practice Solo
            </motion.button>
            {(showExams || !backendReady) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/exams")}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-8 py-4 text-lg font-black text-foreground transition-all hover:border-primary/30 hover:bg-primary/5"
              >
                <ClipboardList className="h-6 w-6" />
                Exam papers
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 container mx-auto -mt-12 px-4"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-3xl p-6 text-center"
            >
              <p className={cn("text-3xl font-black", stat.className)}>{stat.value}</p>
              <p className="mt-1 text-sm font-bold text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-2 text-center text-3xl font-black">
            Choose Your Arena ⚔️
          </h2>
          <p className="text-lg font-bold text-muted-foreground">Pick a subject and start your quest</p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subject, i) => (
            <motion.button
              key={subject.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/quiz/${subject.id}`)}
              className={cn(
                "glass-card group cursor-pointer rounded-3xl border-2 border-transparent p-6 text-left transition-all",
                subjectHover[subject.color]
              )}
            >
              <div className="mb-4 text-5xl transition-transform duration-300 group-hover:scale-110">
                {subject.emoji}
              </div>
              <h3 className="mb-1 text-lg font-black">{subject.name}</h3>
              <p className="mb-4 font-medium leading-relaxed text-muted-foreground">{subject.description}</p>
              <div className="flex items-center gap-2 text-sm font-black text-primary">
                Play Now <ArrowRight className="h-4 w-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-3xl bg-primary p-12 text-center shadow-2xl shadow-primary/20 sm:p-20"
        >
          <div className="relative z-10">
            <h2 className="mb-3 text-3xl font-black text-primary-foreground sm:text-4xl">Level Up Your Brain 🧠</h2>
            <p className="mb-10 text-xl font-bold text-primary-foreground/80 sm:text-2xl">Battle. Learn. Win. — Future Tech Starts Here</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/subjects")}
              className="rounded-2xl bg-card px-8 py-3 font-black text-foreground shadow-lg transition-all"
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
