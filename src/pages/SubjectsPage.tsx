import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { subjects } from "@/data/quizData";
import { ArrowRight } from "lucide-react";

const SubjectsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#F8F9FA]">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4 text-gray-900 tracking-tight">
            Choose Your Subject 📚
          </h1>
          <p className="text-gray-500 font-bold text-xl">Pick a topic and test your knowledge</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {subjects.map((subject, i) => (
            <motion.button
              key={subject.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/quiz/${subject.id}`)}
              className="bg-white rounded-[2.5rem] p-10 text-left group cursor-pointer border-2 border-gray-50 shadow-sm hover:shadow-xl hover:border-primary/10 transition-all flex items-center gap-8"
            >
              <div className="text-7xl shrink-0 transform group-hover:scale-110 transition-transform duration-300">
                {subject.emoji}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black mb-2 text-gray-900">{subject.name}</h2>
                <p className="text-gray-500 font-medium leading-relaxed mb-6">{subject.description}</p>
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-sm opacity-60 group-hover:opacity-100 transition-opacity">
                  Start Quiz <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
