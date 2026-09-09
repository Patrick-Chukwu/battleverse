import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup, type Variants } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { subjects, type Subject } from "@/data/quizData";
import { useBattleStore } from "@/store/useBattleStore";
import { defaultProfile, useGameStore } from "@/store/gameStore";
import { useSession } from "@/hooks/useSession";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isInvitesEnabled, isLiveBattleEnabled } from "@/lib/flags";
import { rpcRedeemInviteCode } from "@/lib/invite-api";
import { inviteShareUrl } from "@/lib/invite-search";
import { ChallengeSheet } from "@/components/invite/ChallengeSheet";
import { 
  Swords, 
  ChevronRight, 
  Timer, 
  Trophy, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  Zap,
  ShieldCheck,
  Copy,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AGE_GROUPS = [
  { id: "6-8", label: "6-8", sub: "Juniors", icon: "🌱" },
  { id: "9-12", label: "9-12", sub: "Explorers", icon: "🌿" },
  { id: "13-16", label: "13-16", sub: "Masters", icon: "🌳" },
];

const BattlePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = useGameStore((s) => s.profile) ?? defaultProfile;
  const addXp = useGameStore((s) => s.addXp);
  const battle = useBattleStore();
  const { data: session } = useSession();
  const online = useOnlineStatus();
  const live = isLiveBattleEnabled();
  const invites = isInvitesEnabled();
  const signedIn = Boolean(session);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedAge, setSelectedAge] = useState<string>("9-12");
  const [challengeOpen, setChallengeOpen] = useState(false);
  const roundCount = Math.max(battle.battleQuestions.length, 1);
  const canEnterLive = !live || (online && signedIn);
  const enterDisabled = !selectedSubject || !canEnterLive;
  const challengeDisabled = !selectedSubject || !invites || !signedIn;
  const awardedLocalXp = useRef(false);
  const joiningCode = useRef<string | null>(null);
  const joinBattle = battle.joinBattle;
  const busyInArena = battle.isPlaying || battle.isWaitingInvite || battle.isSearching;

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || !invites) return;
    if (!signedIn) {
      toast.message("Sign in to join this challenge.");
      return;
    }
    if (!online) {
      toast.error("You need a connection to join a challenge.");
      return;
    }
    if (joiningCode.current === code || busyInArena) return;
    joiningCode.current = code;
    void rpcRedeemInviteCode(code)
      .then((invite) => {
        if (invite.battle_id) joinBattle(invite.battle_id);
        setSearchParams({}, { replace: true });
      })
      .catch((err: unknown) => {
        joiningCode.current = null;
        toast.error(err instanceof Error ? err.message : "Could not join that invite.");
      });
  }, [busyInArena, invites, joinBattle, online, searchParams, setSearchParams, signedIn]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (battle.isPlaying && !battle.isFinished) {
      interval = setInterval(() => {
        battle.tickTimer();
      }, 100);
    }
    return () => clearInterval(interval);
  }, [battle.isPlaying, battle.isFinished, battle.tickTimer]);

  useEffect(() => {
    if (battle.isLive) return;
    if (!battle.isFinished) {
      awardedLocalXp.current = false;
      return;
    }
    if (awardedLocalXp.current) return;
    awardedLocalXp.current = true;
    addXp(battle.score);
  }, [battle.isLive, battle.isFinished, battle.score, addXp]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.4 } }
  };

  // --- UI Components ---

  const BackgroundDecorator = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-game-blue/10 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-game-purple/10 rounded-full blur-[150px] animate-float-reverse" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-game-orange/5 rounded-full blur-[100px] animate-float" />
    </div>
  );

  // State A0: Waiting on a directed challenge
  if (battle.isWaitingInvite && !battle.isPlaying && !battle.isFinished) {
    return (
      <div className="page-offset flex flex-col items-center justify-center overflow-hidden bg-[#050505] px-4 py-8 text-white">
        <BackgroundDecorator />
        <motion.div className="relative flex w-full max-w-md items-center justify-center py-8 sm:aspect-square">
          {[1, 1.5, 2].map((scale, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: scale * 2, opacity: [0, 0.2, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: i * 0.5 }}
              className="absolute inset-0 hidden rounded-full border-2 border-white/20 sm:block"
            />
          ))}
          <div className="z-10 flex items-center gap-4 sm:gap-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/10 text-4xl shadow-2xl backdrop-blur-2xl sm:h-32 sm:w-32 sm:rounded-[2.5rem] sm:text-6xl">
              {profile.avatar}
            </div>
            <div className="text-2xl font-black italic tracking-tighter text-white/40 sm:text-4xl">VS</div>
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/5 text-4xl shadow-2xl backdrop-blur-xl sm:h-32 sm:w-32 sm:rounded-[2.5rem] sm:text-6xl">
              🎯
            </div>
          </div>
        </motion.div>
        <div className="mt-8 text-center sm:mt-12">
          <h2 className="text-title mb-2 font-black tracking-tight">
            {battle.inviteLabel ?? "WAITING FOR YOUR RIVAL"}
          </h2>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">
            Challenge invite · 10 minute window
          </p>
          {battle.inviteCode && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="font-black tracking-[0.4em] text-white">{battle.inviteCode}</p>
              <Button
                type="button"
                variant="ctaSecondary"
                onClick={() => {
                  const url = inviteShareUrl(battle.inviteCode as string);
                  void navigator.clipboard.writeText(url).then(
                    () => toast.success("Invite link copied."),
                    () => toast.message(url)
                  );
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy link
              </Button>
            </div>
          )}
          <Button onClick={() => battle.cancelSearch()} variant="ctaSecondary" className="mt-8">
            CANCEL CHALLENGE
          </Button>
        </div>
      </div>
    );
  }

  // State A: Setup Menu
  if (!battle.isPlaying && !battle.isSearching && !battle.isFinished) {
    return (
      <div className="page-shell relative overflow-hidden bg-background">
        <BackgroundDecorator />
        <div className="mx-auto max-w-3xl">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-8 text-center sm:mb-12"
          >
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-border/50 bg-card shadow-game sm:mb-6 sm:h-20 sm:w-20"
            >
              <Swords className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
            </motion.div>
            <h1 className="text-title mb-3 font-black tracking-tight text-primary">
              Arena Setup
            </h1>
            <p className="text-base font-semibold text-muted-foreground sm:text-lg">Configure your legendary duel</p>
          </motion.div>

          <div className="space-y-8 sm:space-y-12">
            {/* Subject Selection - Asymmetric Grid */}
            <section>
              <div className="mb-4 flex items-center gap-3 sm:mb-6">
                <div className="h-8 w-1.5 rounded-full bg-game-blue shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">Choose Subject</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
                {subjects.map((s, idx) => (
                  <motion.button
                    key={s.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSubject(s.id)}
                    className={cn(
                      "glass-card relative group overflow-hidden rounded-3xl border-2 p-4 transition-all sm:p-6",
                      idx === 0 || idx === 3 ? "col-span-1 md:col-span-4" : "col-span-1 md:col-span-2",
                      selectedSubject === s.id
                        ? "border-primary shadow-game"
                        : "border-transparent hover:border-primary/20"
                    )}
                  >
                    <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                      <span className="text-3xl filter drop-shadow-md sm:text-4xl">{s.emoji}</span>
                      <div className="min-w-0 text-left">
                        <span className="mb-1 block truncate text-base font-black leading-none sm:text-xl">{s.name}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                          {s.id === "ai" ? "FutureTech" : s.id === "tech" ? "Digital" : "Fundamentals"}
                        </span>
                      </div>
                    </div>
                    {selectedSubject === s.id && (
                      <motion.div 
                        layoutId="activeSubject"
                        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Age Selection - Premium Segmented Control */}
            <section>
              <div className="mb-4 flex items-center gap-3 sm:mb-6">
                <div className="h-8 w-1.5 rounded-full bg-game-purple shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">Age Bracket</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4">
                {AGE_GROUPS.map((age) => (
                  <motion.button
                    key={age.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedAge(age.id)}
                    className={cn(
                      "glass-card flex min-w-0 flex-1 flex-col items-center rounded-2xl border-2 p-3 transition-all sm:rounded-3xl sm:p-5",
                      selectedAge === age.id
                        ? "border-primary shadow-game"
                        : "border-transparent text-muted-foreground opacity-70 hover:border-primary/20 hover:opacity-100"
                    )}
                  >
                    <span className="mb-1 text-2xl sm:mb-2 sm:text-3xl">{age.icon}</span>
                    <span className="text-sm font-black sm:text-lg">{age.label}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{age.sub}</span>
                  </motion.button>
                ))}
              </div>
            </section>

            {invites && (
              <motion.div whileHover={challengeDisabled || !online ? undefined : { scale: 1.03 }} whileTap={challengeDisabled || !online ? undefined : { scale: 0.97 }}>
                <Button
                  disabled={challengeDisabled}
                  onClick={() => setChallengeOpen(true)}
                  variant="ctaSecondary"
                  size="xl"
                  className="relative w-full py-5 text-lg disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    <UserPlus className="h-6 w-6" />
                    CHALLENGE A RIVAL
                  </span>
                </Button>
              </motion.div>
            )}

            <motion.div whileHover={enterDisabled ? undefined : { scale: 1.05 }} whileTap={enterDisabled ? undefined : { scale: 0.95 }}>
              <Button
                disabled={enterDisabled}
                onClick={() => selectedSubject && battle.startSearch(selectedSubject, selectedAge)}
                variant="cta"
                size="xl"
                className="animate-pulse-glow relative w-full overflow-hidden py-5 text-lg disabled:opacity-50"
              >
                <motion.div 
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                />
                <span className="flex items-center gap-3">
                  ENTER BATTLEVERSE ARENA <Zap className="w-6 h-6 fill-current" />
                </span>
              </Button>
            </motion.div>
            {invites && (
              <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Matchmaking is the fallback if nobody you know is around
              </p>
            )}
            <ChallengeSheet
              open={challengeOpen}
              onOpenChange={setChallengeOpen}
              subject={selectedSubject}
              ageBand={selectedAge}
            />
            {live && !online && (
              <p className="text-center text-sm font-bold text-muted-foreground">
                You need a connection to enter a live battle. Bots are not used as a fallback.
              </p>
            )}
            {live && online && !signedIn && (
              <p className="text-center text-sm font-bold text-muted-foreground">
                <Link to="/login" className="text-primary underline">
                  Sign in
                </Link>{" "}
                to find a real rival or send a challenge. Guest play stays on Practice.
              </p>
            )}
            {invites && signedIn && !online && (
              <p className="text-center text-sm font-bold text-muted-foreground">
                Challenges need a connection. You can still queue a named invite from Challenge.
              </p>
            )}
            {battle.error && (
              <p className="text-center text-sm font-bold text-destructive">{battle.error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // State B: Matchmaking
  if (battle.isSearching) {
    return (
      <div className="page-offset flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050505] px-4 py-8 text-white">
        <BackgroundDecorator />
        
        <motion.div 
          className="relative flex w-full max-w-md items-center justify-center py-8 sm:aspect-square"
        >
          {/* Circular Pulse Effects */}
          {[1, 1.5, 2].map((scale, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: scale * 2, opacity: [0, 0.2, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: i * 0.5 }}
              className="absolute inset-0 border-2 border-white/20 rounded-full"
            />
          ))}

          <div className="z-10 flex items-center gap-4 sm:gap-12">
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="relative"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/10 text-4xl shadow-2xl backdrop-blur-2xl sm:h-32 sm:w-32 sm:rounded-[2.5rem] sm:text-6xl">
                {profile.avatar}
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-4 -right-4 bg-game-blue p-2 rounded-xl shadow-lg"
              >
                <ShieldCheck className="w-6 h-6" />
              </motion.div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-2xl font-black italic tracking-tighter text-white/40 sm:text-4xl"
            >
              VS
            </motion.div>

            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/5 text-4xl shadow-2xl backdrop-blur-xl sm:h-32 sm:w-32 sm:rounded-[2.5rem] sm:text-6xl"
            >
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                ❓
              </motion.span>
            </motion.div>
          </div>
        </motion.div>

        <div className="mt-8 text-center sm:mt-12">
          <motion.h2 
            animate={{ opacity: [0.5, 1, 0.5] }}
            className="text-title mb-2 font-black tracking-tight"
          >
            SCANNING FOR RIVALS
          </motion.h2>
          <p className="font-bold text-white/40 uppercase tracking-[0.3em] text-sm">
            {battle.isLive ? "Waiting for a human rival" : "Synchronizing Cloud State"}
          </p>
          <Button
            onClick={() => battle.cancelSearch()}
            variant="ctaSecondary"
            className="mt-8"
          >
            CANCEL
          </Button>
        </div>
      </div>
    );
  }

  // State D: Results Screen
  if (battle.isFinished) {
    const allParticipants = [
      { name: profile.name, avatar: profile.avatar, score: battle.score, isPlayer: true },
      ...battle.rivals.map(r => ({ ...r, isPlayer: false }))
    ].sort((a, b) => b.score - a.score);

    const playerRank = allParticipants.findIndex(p => p.isPlayer) + 1;

    return (
      <div className="page-shell bg-background">
        <BackgroundDecorator />
        <div className="mx-auto max-w-xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center"
          >
            <div className="mb-12 relative inline-block">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="mb-4 select-none text-7xl leading-none sm:text-[10rem]"
              >
                {playerRank === 1 ? "🏆" : playerRank === 2 ? "🥈" : "🥉"}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute top-0 right-0"
              >
                <Sparkles className="w-16 h-16 text-yellow-400 animate-pulse" />
              </motion.div>
            </div>

            <h1 className="text-title mb-4 font-black tracking-tighter">
              {playerRank === 1 ? "ELITE CHAMPION" : playerRank === 2 ? "MASTER CLASS" : "VALIANT EFFORT"}
            </h1>
            <p className="text-muted-foreground font-black uppercase tracking-[0.4em] mb-12">
              Arena Standing: Rank #{playerRank}
            </p>
            {battle.opponentLeft && (
              <p className="mb-8 text-sm font-bold text-muted-foreground">
                Your opponent left the arena. This match is a forfeit.
              </p>
            )}

            <div className="glass-card mb-10 overflow-hidden rounded-3xl p-4">
              <div className="space-y-3">
                {allParticipants.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    className={cn(
                      "flex items-center gap-3 rounded-[1.5rem] p-3 transition-all sm:gap-5 sm:rounded-[2rem] sm:p-5",
                      p.isPlayer 
                        ? "z-10 scale-[1.02] bg-primary text-primary-foreground shadow-2xl" 
                        : "bg-white/50 dark:bg-black/20"
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/5 text-lg font-black italic dark:bg-white/10 sm:h-10 sm:w-10 sm:text-xl">
                      {i + 1}
                    </div>
                    <span className="text-3xl sm:text-4xl">{p.avatar}</span>
                    <div className="min-w-0 flex-1 text-left">
                      <span className="mb-1 block truncate text-base font-black leading-none sm:text-lg">{p.name}</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", p.isPlayer && "opacity-80")}>
                        {p.isPlayer ? "Your Profile" : "Arena Opponent"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-2xl tracking-tighter">{p.score}</span>
                      <span className="text-[10px] font-black uppercase ml-1 opacity-50">XP</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Button
                onClick={() => battle.resetBattle()}
                variant="ctaSecondary"
                size="xl"
                className="py-5"
              >
                <RotateCcw className="mr-3 h-6 w-6" /> REMATCH
              </Button>
              <Button
                onClick={() => {
                  battle.resetBattle();
                  navigate("/");
                }}
                variant="cta"
                size="xl"
                className="py-5"
              >
                LEAVE ARENA
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // State C: Battle Loop
  const currentQuestion = battle.battleQuestions[battle.currentQuestionIndex];
  if (!currentQuestion) return null;

  const timerColor = battle.timer > 6 
    ? "from-emerald-400 to-cyan-400" 
    : battle.timer > 3 
      ? "from-amber-400 to-orange-400" 
      : "from-rose-500 to-red-600";

  return (
    <div className="page-shell relative overflow-hidden bg-background">
      <BackgroundDecorator />
      <div className="relative z-10 mx-auto max-w-2xl">
        <LayoutGroup>
          {battle.reconnectSeconds !== null && battle.reconnectSeconds > 0 && (
            <p className="mb-4 text-center text-sm font-black uppercase tracking-widest text-amber-600">
              Opponent reconnecting · {battle.reconnectSeconds}s
            </p>
          )}
          {/* Header Scoreboard - Floating Glass */}
          <motion.div 
            layout
            className="glass-card mb-5 flex items-center justify-between gap-3 rounded-3xl p-3 sm:mb-10 sm:p-6"
          >
            <div className="flex -space-x-3 sm:-space-x-4">
              <motion.div 
                whileHover={{ y: -5 }}
                className="z-30 flex h-12 w-12 items-center justify-center rounded-[1.1rem] border-4 border-white bg-primary text-2xl shadow-2xl ring-4 ring-primary/5 dark:border-[#111] sm:h-16 sm:w-16 sm:rounded-[1.5rem] sm:text-3xl sm:ring-8"
              >
                {profile.avatar}
              </motion.div>
              {battle.rivals.map((r, i) => (
                <motion.div 
                  key={r.name} 
                  whileHover={{ y: -5 }}
                  className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-[1.1rem] border-4 border-white bg-white text-2xl shadow-xl transition-all dark:border-[#111] dark:bg-white/5 sm:h-16 sm:w-16 sm:rounded-[1.5rem] sm:text-3xl",
                    i === 0 ? "z-20 -translate-x-2" : "z-10 -translate-x-4",
                    battle.hasAnswered && r.lastCorrect === false && "grayscale"
                  )}
                >
                  {r.avatar}
                  {battle.hasAnswered && r.lastCorrect !== null && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={cn(
                        "absolute -top-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center shadow-xl border-2 border-white dark:border-[#111]",
                        r.lastCorrect ? "bg-game-green text-white" : "bg-destructive text-white"
                      )}
                    >
                      {r.lastCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Trophy className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6" />
                <span className="text-2xl font-black leading-none tracking-tighter tabular-nums sm:text-4xl">{battle.score}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-12 bg-primary/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((battle.currentQuestionIndex + 1) / roundCount) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                  Round {battle.currentQuestionIndex + 1}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Question Card */}
          <motion.div
            layout
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="glass-card relative mb-5 overflow-hidden rounded-3xl p-5 sm:mb-8 sm:p-10"
          >
            <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.07]" />
            
            <div className="relative z-10">
              <h2 className="text-heading mb-6 px-1 text-center font-black leading-tight tracking-tight sm:mb-10 sm:px-4">
                {currentQuestion.question}
              </h2>

              <div className="grid gap-3 sm:gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = battle.selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;
                  const showResult = battle.hasAnswered;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!showResult ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      disabled={showResult}
                      onClick={() => battle.submitAnswer(idx)}
                      className={cn(
                        "group relative flex w-full min-h-14 items-center justify-between overflow-hidden rounded-[1.5rem] border-2 p-4 text-left font-black transition-all sm:rounded-[2rem] sm:p-6",
                        !showResult && "bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10",
                        showResult && isCorrect && "bg-game-green/10 border-game-green text-game-green shadow-[0_0_30px_rgba(34,197,94,0.1)]",
                        showResult && isSelected && !isCorrect && "bg-destructive/10 border-destructive text-destructive shadow-[0_0_30px_rgba(231,0,11,0.1)]",
                        showResult && !isSelected && !isCorrect && "opacity-30 border-transparent blur-[1px]"
                      )}
                    >
                      <span className="relative z-10 min-w-0 text-base tracking-tight sm:text-lg">{option}</span>
                      <AnimatePresence>
                        {showResult && isCorrect && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-10 bg-game-green p-1.5 rounded-xl shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-10 bg-destructive p-1.5 rounded-xl shadow-lg">
                            <XCircle className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Footer Controls & Timer */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-full p-2 border border-white dark:border-white/10 shadow-xl overflow-hidden relative h-16">
              <div className="absolute inset-2 flex items-center justify-between px-6 z-10 pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-lg transition-colors", battle.timer < 3 ? "bg-rose-500 text-white animate-pulse" : "bg-primary/10 text-primary")}>
                    <Timer className="w-5 h-5" />
                  </div>
                  <span className="font-black tabular-nums text-lg tracking-tighter">{battle.timer.toFixed(1)}s</span>
                </div>
                {battle.streak > 1 && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white px-5 py-2 rounded-full shadow-lg shadow-orange-500/20 ring-2 ring-white/20"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span className="font-black text-xs uppercase tracking-widest">{battle.streak} STREAK</span>
                  </motion.div>
                )}
              </div>
              <motion.div 
                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-100 opacity-60", timerColor)}
                initial={{ width: "100%" }}
                animate={{ width: `${(battle.timer / (battle.questionDurationMs / 1000 || 10)) * 100}%` }}
              />
            </div>

            <AnimatePresence>
              {battle.hasAnswered && (
                <motion.div
                  initial={{ y: 50, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  className="group flex flex-col items-stretch gap-3 rounded-[1.75rem] bg-primary p-3 shadow-2xl sm:flex-row sm:items-center sm:gap-4 sm:rounded-[2.5rem] sm:p-1.5"
                >
                  <div className="ml-1 hidden h-16 w-16 shrink-0 items-center justify-center rounded-[2rem] bg-white/10 text-primary-foreground backdrop-blur-md sm:ml-2 sm:flex">
                    <Lightbulb className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1 px-2 py-2 sm:py-4">
                    <h4 className="mb-1 text-xs font-black tracking-widest text-primary-foreground uppercase opacity-60 sm:text-sm">Academy Insight</h4>
                    <p className="text-sm font-bold leading-tight text-primary-foreground sm:pr-6">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                  {battle.isLive ? (
                    <div className="px-2 pb-2 text-xs font-black tracking-widest text-primary-foreground/80 uppercase sm:mr-4 sm:pr-2 sm:pb-0 sm:text-right">
                      {battle.timer > 0 ? "Waiting for the round clock" : "Next round incoming"}
                    </div>
                  ) : (
                    <Button
                      onClick={() => battle.nextQuestion()}
                      className="h-12 w-full rounded-2xl bg-white p-0 text-primary shadow-xl transition-all hover:bg-white/90 sm:mr-2 sm:h-16 sm:w-16 sm:rounded-[2rem]"
                    >
                      <span className="font-black sm:hidden">Next</span>
                      <ChevronRight className="hidden h-8 w-8 sm:block" />
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
};

export default BattlePage;
