import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { getLevel } from "@/data/gameData";
import { Home, Trophy, User, Zap } from "lucide-react";

export function Navbar() {
  const { profile } = useGameStore();
  // const levelInfo = getLevel(profile.xp); // unused
  const location = useLocation();

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <span className="text-xl font-black text-gradient-primary">Battleverse</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <link.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-warning/10 text-warning-foreground px-3 py-1.5 rounded-xl">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-sm font-bold">{profile.xp} XP</span>
          </div>
          <Link to="/profile" className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl hover:bg-muted/80 transition-colors">
            <span className="text-lg">{profile.avatar}</span>
            <span className="text-sm font-bold hidden sm:inline">{profile.name}</span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
