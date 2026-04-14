import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { subjects } from "@/data/quizData";
import { Swords, Users, Wifi } from "lucide-react";

const BattlePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-lg text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-6xl mb-6">⚔️</div>
          <h1 className="text-4xl font-black mb-3">Battle Mode</h1>
          <p className="text-muted-foreground font-semibold text-lg mb-8">
            Real-time multiplayer is coming soon! For now, practice your skills in solo mode.
          </p>

          <div className="glass-card rounded-3xl p-8 mb-6">
            <div className="flex items-center gap-3 justify-center text-muted-foreground mb-4">
              <Wifi className="w-5 h-5" />
              <span className="font-bold">Real-time battles • Coming Soon</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-muted-foreground mb-4">
              <Users className="w-5 h-5" />
              <span className="font-bold">Challenge friends • Coming Soon</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/subjects")}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all"
          >
            Practice Solo Instead 🎯
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default BattlePage;
