import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { subjects } from "@/data/quizData";
import { ArrowRight } from "lucide-react";

const SubjectsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-12">
          <h1 className="text-4xl font-black mb-2">Choose Your Subject 📚</h1>
          <p className="text-muted-foreground font-semibold text-lg">Pick a topic and test your knowledge</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {subjects.map((subject, i) => (
            <motion.button
              key={subject.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/quiz/${subject.id}`)}
              className="glass-card rounded-3xl p-8 text-left group hover:game-shadow transition-all"
            >
              <span className="text-6xl block mb-4">{subject.emoji}</span>
              <h2 className="text-2xl font-black mb-2">{subject.name}</h2>
              <p className="text-muted-foreground font-medium mb-4">{subject.description}</p>
              <div className="flex items-center gap-2 text-primary font-bold">
                Start Quiz <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
