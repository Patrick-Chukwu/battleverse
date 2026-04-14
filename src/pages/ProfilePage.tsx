import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { getLevel, badges, avatars } from "@/data/gameData";
import { Edit3, Check } from "lucide-react";

const ProfilePage = () => {
  const { profile, setName, setAvatar } = useGameStore();
  const levelInfo = getLevel(profile.xp);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showAvatars, setShowAvatars] = useState(false);

  const accuracy = profile.totalAnswers > 0 
    ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100) 
    : 0;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Profile card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-card rounded-3xl p-8 text-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAvatars(!showAvatars)}
            className="text-7xl mb-4 inline-block cursor-pointer"
          >
            {profile.avatar}
          </motion.button>

          {showAvatars && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="flex flex-wrap justify-center gap-3 mb-4"
            >
              {avatars.map(a => (
                <button
                  key={a}
                  onClick={() => { setAvatar(a); setShowAvatars(false); }}
                  className={`text-3xl p-2 rounded-xl hover:bg-muted transition-colors ${profile.avatar === a ? "bg-primary/10 ring-2 ring-primary" : ""}`}
                >
                  {a}
                </button>
              ))}
            </motion.div>
          )}

          {editingName ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="bg-muted rounded-xl px-4 py-2 font-bold text-center text-xl outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                maxLength={15}
              />
              <button
                onClick={() => { setName(nameInput || "Player"); setEditingName(false); }}
                className="bg-primary text-primary-foreground p-2 rounded-xl"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-2 mx-auto text-2xl font-black hover:text-primary transition-colors"
            >
              {profile.name}
              <Edit3 className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          <p className="text-muted-foreground font-semibold mt-1">
            Level {levelInfo.level} • {levelInfo.title}
          </p>

          {/* XP bar */}
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex justify-between text-sm text-muted-foreground font-semibold mb-1">
              <span>{profile.xp} XP</span>
              <span>{levelInfo.nextLevelXp} XP</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-game-purple rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Quizzes", value: profile.quizzesCompleted, color: "text-primary" },
            { label: "Accuracy", value: `${accuracy}%`, color: "text-game-green" },
            { label: "Coins", value: `🪙 ${profile.coins}`, color: "text-game-orange" },
            { label: "Streak", value: `🔥 ${profile.streak}`, color: "text-game-pink" },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground font-semibold">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-black mb-4">Badges 🏅</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {badges.map(badge => {
              const earned = profile.earnedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`glass-card rounded-2xl p-4 text-center transition-all ${
                    earned ? "" : "opacity-40 grayscale"
                  }`}
                >
                  <span className="text-3xl block mb-2">{badge.emoji}</span>
                  <p className="font-bold text-sm">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.requirement}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
