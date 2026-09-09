import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, Home, Swords, Trophy, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useInviteInbox } from "@/hooks/useInviteInbox";
import { isInvitesEnabled } from "@/lib/flags";
import { useSession } from "@/hooks/useSession";
import { useBattleStore } from "@/store/useBattleStore";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, label: "Home", match: (path: string) => path === "/" },
  {
    to: "/subjects",
    icon: BookOpen,
    label: "Practice",
    match: (path: string) =>
      path.startsWith("/subjects") || path.startsWith("/quiz") || path.startsWith("/exam"),
  },
  {
    to: "/battle",
    icon: Swords,
    label: "Arena",
    featured: true,
    match: (path: string) => path.startsWith("/battle"),
  },
  {
    to: "/leaderboard",
    icon: Trophy,
    label: "Board",
    match: (path: string) => path.startsWith("/leaderboard"),
  },
  {
    to: "/profile",
    icon: User,
    label: "You",
    match: (path: string) => path.startsWith("/profile") || path.startsWith("/login"),
  },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const { data: session } = useSession();
  const { pendingCount } = useInviteInbox();
  const immersive = useBattleStore(
    (s) => s.isPlaying || s.isSearching || s.isWaitingInvite
  );
  const hide =
    pathname.startsWith("/admin") || (pathname.startsWith("/battle") && immersive);

  useEffect(() => {
    document.body.dataset.chrome = hide ? "immersive" : "default";
    return () => {
      delete document.body.dataset.chrome;
    };
  }, [hide]);

  if (hide) return null;

  const showBadge = isInvitesEnabled() && Boolean(session) && pendingCount > 0;

  return (
    <nav
      aria-label="Primary"
      className="glass-card fixed inset-x-0 bottom-0 z-50 border-t border-border/60 pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      <div className="grid h-[4.25rem] grid-cols-5 items-end">
        {items.map((item) => {
          const active = item.match(pathname);
          const featured = "featured" in item && item.featured;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-black tracking-wide text-muted-foreground",
                featured && "-translate-y-2"
              )}
              activeClassName=""
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-2xl transition-colors",
                  featured
                    ? "h-14 w-14 bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "h-9 w-9",
                  !featured && active && "bg-primary/10 text-primary",
                  featured && active && "ring-2 ring-primary-foreground/40"
                )}
              >
                <item.icon className={featured ? "h-6 w-6" : "h-5 w-5"} />
              </span>
              <span className={cn(active && "text-primary")}>{item.label}</span>
              {featured && showBadge && (
                <span className="absolute top-0 right-[calc(50%-1.75rem)] flex h-4 min-w-4 items-center justify-center rounded-full bg-game-orange px-1 text-[10px] font-black text-white">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
