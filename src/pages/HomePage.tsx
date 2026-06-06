import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FloatingIcons } from "@/components/FloatingIcons";
import { subjects } from "@/data/quizData";
import { useGameStore } from "@/store/gameStore";
import { getLevel } from "@/data/gameData";
import { Swords, BookOpen, ArrowRight } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const { profile } = useGameStore();
  const levelInfo = getLevel(profile.xp);

  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <FloatingIcons />
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-background" />
        
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-6xl mb-6"
          >
            🚀
          </motion.div>
          
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-7xl font-black mb-4"
          >
            Welcome to{" "}
            <span className="text-gradient-primary">Battleverse</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl text-muted-foreground font-semibold mb-8"
          >
            Learn. Play. Compete. 🎯
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate("/battle")}
              className="group flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-lg font-black shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 animate-pulse-glow"
            >
              <Swords className="w-5 h-5" />
              Start Battle
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/subjects")}
              className="flex items-center justify-center gap-2 bg-card text-foreground px-8 py-4 rounded-2xl text-lg font-black border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all hover:scale-105 active:scale-95"
            >
              <BookOpen className="w-5 h-5" />
              Practice Solo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <motion.section
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 -mt-8"
      >
        <div className="glass-card rounded-3xl p-6 flex flex-wrap items-center justify-center gap-6 sm:gap-12">
          <div className="text-center">
            <p className="text-3xl font-black text-primary">{profile.xp}</p>
            <p className="text-sm text-muted-foreground font-semibold">Total XP</p>
          </div>
          <div className="w-px h-10 bg-border hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-black text-game-orange">{levelInfo.title}</p>
            <p className="text-sm text-muted-foreground font-semibold">Level {levelInfo.level}</p>
          </div>
          <div className="w-px h-10 bg-border hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-black text-game-green">{profile.quizzesCompleted}</p>
            <p className="text-sm text-muted-foreground font-semibold">Quizzes Done</p>
          </div>
          <div className="w-px h-10 bg-border hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-black text-game-pink">🔥 {profile.streak}</p>
            <p className="text-sm text-muted-foreground font-semibold">Streak</p>
          </div>
        </div>
      </motion.section>

      {/* Subjects */}
      <section className="container mx-auto px-4 py-16">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-black text-center mb-2"
        >
          Choose Your Arena ⚔️
        </motion.h2>
        <p className="text-center text-muted-foreground font-semibold mb-10">Pick a subject and start your quest</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {subjects.map((subject, i) => (
            <motion.button
              key={subject.id}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/quiz/${subject.id}`)}
              className={`glass-card rounded-3xl p-6 text-left group cursor-pointer border-2 border-transparent hover:border-${subject.color}/30 transition-all`}
            >
              <span className="text-5xl block mb-4">{subject.emoji}</span>
              <h3 className="text-lg font-black mb-1">{subject.name}</h3>
              <p className="text-sm text-muted-foreground">{subject.description}</p>
              <div className="mt-4 flex items-center gap-1 text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Play Now <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Tagline */}
      <section className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-linear-to-r from-primary to-game-purple rounded-3xl p-12 text-primary-foreground"
        >
          <h2 className="text-3xl sm:text-4xl font-black mb-3">Level Up Your Brain 🧠</h2>
          <p className="text-lg opacity-90 font-semibold mb-6">Battle. Learn. Win. — Future Tech Starts Here</p>
          <button
            onClick={() => navigate("/subjects")}
            className="bg-card text-foreground px-8 py-3 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all"
          >
            Start Learning Now
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
