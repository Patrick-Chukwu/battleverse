import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { defaultProfile, useGameStore } from "@/store/gameStore";
import { Home, Swords, Trophy, User, Zap } from "lucide-react";
import { NavLink } from "./NavLink";
import { useSession } from "@/hooks/useSession";
import { signOut } from "@/hooks/useProfile";
import { useInviteInbox } from "@/hooks/useInviteInbox";
import { isInvitesEnabled, isSupabaseConfigured } from "@/lib/flags";

export function Navbar() {
  const profile = useGameStore((s) => s.profile) ?? defaultProfile;
  const { data: session } = useSession();
  const navigate = useNavigate();
  const showAuth = isSupabaseConfigured();
  const { pendingCount } = useInviteInbox();
  const showInvites = isInvitesEnabled() && Boolean(session);

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="glass-card fixed top-0 right-0 left-0 z-50 h-[66px] border-b border-border/50">
      <div className="container mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
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

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              activeClassName="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <link.icon className="h-5 w-5" />
              <span className="hidden sm:inline">{link.label}</span>
            </NavLink>
          ))}
          {showInvites && (
            <NavLink
              to="/battle"
              className="relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              activeClassName="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Swords className="h-5 w-5" />
              <span className="hidden sm:inline">Arena</span>
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-sm font-black sm:flex">
            <Zap className="h-4 w-4 fill-current text-game-orange" />
            <span>{profile.xp} XP</span>
          </div>

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-xl bg-muted px-3 py-1.5 transition-colors hover:bg-muted/80"
          >
            <span className="text-xl leading-none">{profile.avatar}</span>
            <span className="hidden text-sm font-black sm:inline">
              {profile.name}
            </span>
          </Link>
          {showAuth && !session && (
            <Link
              to="/login"
              className="hidden rounded-xl px-3 py-1.5 text-sm font-black text-primary sm:inline"
            >
              Sign in
            </Link>
          )}
          {showAuth && session && (
            <button
              type="button"
              onClick={() => {
                void signOut().then(() => navigate("/"));
              }}
              className="hidden rounded-xl px-2 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground sm:inline"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
