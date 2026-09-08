import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { subjects } from "@/data/quizData";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const subjectHover: Record<string, string> = {
  "game-blue": "hover:border-game-blue/30",
  "game-purple": "hover:border-game-purple/30",
  "game-orange": "hover:border-game-orange/30",
  "game-green": "hover:border-game-green/30",
};

const SubjectsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-16">
      <div className="mx-auto w-full max-w-[864px]">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-black tracking-tight">
            Choose Your Subject 📚
          </h1>
          <p className="text-xl font-bold text-muted-foreground">Pick a topic and test your knowledge</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                "glass-card group flex min-h-[246px] cursor-pointer items-center gap-8 rounded-3xl border-2 border-transparent p-8 text-left transition-all hover:game-shadow",
                subjectHover[subject.color]
              )}
            >
              <div className="shrink-0 text-7xl transition-transform duration-300 group-hover:scale-110">
                {subject.emoji}
              </div>
              <div className="flex-1">
                <h2 className="mb-2 text-2xl font-black">{subject.name}</h2>
                <p className="mb-6 font-medium leading-relaxed text-muted-foreground">{subject.description}</p>
                <div className="flex items-center gap-2 text-sm font-black text-primary transition-opacity">
                  Start Quiz <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
