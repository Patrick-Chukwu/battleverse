import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { getLevel } from "@/data/gameData";
import { Home, Trophy, User, Zap, Swords } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { profile } = useGameStore();
  const levelInfo = getLevel(profile.xp);

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/battle", icon: Swords, label: "Arena" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pointer-events-none"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="bg-white/70 dark:bg-black/40 backdrop-blur-[20px] border border-white/40 dark:border-white/10 shadow-2xl shadow-black/5 rounded-[2rem] h-16 flex items-center justify-between px-6 pointer-events-auto relative overflow-hidden">
          {/* Subtle noise overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group relative z-10">
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-xl shadow-lg shadow-primary/20"
            >
              🎮
            </motion.div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 hidden xs:block">
              Battleverse
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl relative z-10">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                activeClassName="bg-white dark:bg-white/10 text-primary shadow-sm"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all text-muted-foreground hover:text-primary relative group"
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <link.icon className={cn("w-4 h-4", isActive ? "fill-primary/10" : "")} />
                    <span className="hidden md:inline uppercase tracking-widest text-[10px]">
                      {link.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl -z-10 shadow-sm border border-white/50 dark:border-white/5"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Profile & XP */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
                Level {levelInfo.level}
              </span>
              <div className="flex items-center gap-1.5 text-game-orange font-black text-sm tabular-nums">
                <Zap className="w-3.5 h-3.5 fill-current" />
                {profile.xp}
              </div>
            </div>

            <Link to="/profile" className="group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-primary p-1 pr-4 rounded-2xl shadow-xl shadow-primary/10 border border-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                  {profile.avatar}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white leading-none truncate max-w-[80px]">
                    {profile.name}
                  </span>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
