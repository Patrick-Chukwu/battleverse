import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { Home, Trophy, User, Zap } from "lucide-react";
import { NavLink } from "./NavLink";

export function Navbar() {
  const { profile } = useGameStore();

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.span 
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="text-2xl"
          >
            🎮
          </motion.span>
          <span className="text-xl font-black tracking-tight text-primary">
            Battleverse
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all text-gray-500 hover:text-primary hover:bg-gray-50"
              activeClassName="bg-indigo-50 text-primary shadow-sm"
            >
              <link.icon className="w-5 h-5" />
              <span className="hidden sm:inline">
                {link.label}
              </span>
            </NavLink>
          ))}
        </div>

        {/* Profile & XP */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* XP Badge */}
          <div className="hidden xs:flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl font-black text-sm border border-amber-100/50 shadow-sm">
            <Zap className="w-4 h-4 fill-current" />
            <span>{profile.xp} XP</span>
          </div>

          {/* User Avatar */}
          <Link to="/profile">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors border border-gray-200/50"
            >
              <span className="text-xl leading-none">{profile.avatar}</span>
              <span className="hidden sm:inline text-sm font-black text-gray-700">
                {profile.name}
              </span>
            </motion.div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
