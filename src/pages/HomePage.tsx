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
    <div className="min-h-screen pt-16 bg-[#F8F9FA]">
      {/* Hero */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        <FloatingIcons />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
            className="text-7xl mb-6"
          >
            🚀
          </motion.div>
          
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl sm:text-8xl font-black mb-6 tracking-tight text-gray-900"
          >
            Welcome to{" "}
            <span className="text-primary">Battleverse</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl text-gray-500 font-bold mb-10"
          >
            Learn. Play. Compete. 🎯
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/battle")}
              className="group flex items-center justify-center gap-3 bg-primary text-white px-10 py-5 rounded-3xl text-xl font-black shadow-xl shadow-indigo-500/20 transition-all"
            >
              <Swords className="w-6 h-6" />
              Start Battle
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/subjects")}
              className="flex items-center justify-center gap-3 bg-white text-gray-900 px-10 py-5 rounded-3xl text-xl font-black border-2 border-gray-100 shadow-lg hover:border-gray-200 transition-all"
            >
              <BookOpen className="w-6 h-6" />
              Practice Solo
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <motion.section
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 -mt-12 relative z-20"
      >
        <div className="bg-white rounded-full p-4 sm:p-6 shadow-xl shadow-gray-200/50 flex flex-wrap items-center justify-center gap-6 sm:gap-16 border border-gray-100">
          <div className="text-center">
            <p className="text-3xl font-black text-primary">{profile.xp}</p>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Total XP</p>
          </div>
          <div className="w-px h-10 bg-gray-100 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-black text-amber-500">{levelInfo.title}</p>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Level {levelInfo.level}</p>
          </div>
          <div className="w-px h-10 bg-gray-100 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-500">{profile.quizzesCompleted}</p>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Quizzes Done</p>
          </div>
          <div className="w-px h-10 bg-gray-100 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-black text-rose-500">🔥 {profile.streak}</p>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Streak</p>
          </div>
        </div>
      </motion.section>

      {/* Subjects */}
      <section className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black mb-3 text-gray-900">
            Choose Your Arena ⚔️
          </h2>
          <p className="text-lg text-gray-500 font-bold">Pick a subject and start your quest</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {subjects.map((subject, i) => (
            <motion.button
              key={subject.id}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/quiz/${subject.id}`)}
              className="bg-white rounded-[2.5rem] p-8 text-center group cursor-pointer border-2 border-gray-50 shadow-sm hover:shadow-xl hover:border-primary/10 transition-all flex flex-col items-center"
            >
              <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {subject.emoji}
              </div>
              <h3 className="text-2xl font-black mb-2 text-gray-900">{subject.name}</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-6">{subject.description}</p>
              <div className="mt-auto flex items-center gap-2 text-primary font-black text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                START QUIZ <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Banner */}
      <section className="container mx-auto px-4 pb-24">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-primary rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/20"
        >
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-6xl font-black mb-6 text-white">Level Up Your Brain 🧠</h2>
            <p className="text-xl sm:text-2xl text-white/80 font-bold mb-10">Battle. Learn. Win. — Future Tech Starts Here</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/subjects")}
              className="bg-white text-primary px-12 py-5 rounded-3xl text-xl font-black shadow-lg transition-all"
            >
              Start Learning Now
            </motion.button>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
