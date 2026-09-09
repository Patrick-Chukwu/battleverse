import type { RealtimeChannel } from "@supabase/supabase-js";
import { questions as bundled, shuffleArray, type Question, type Subject } from "@/data/quizData";
import { avatars } from "@/data/gameData";
import { isLiveBattleEnabled } from "@/lib/flags";
import { getSupabase } from "@/lib/supabase";
import {
  battleReconnectSeconds,
  battleTimerRemaining,
  isBattleFinishedStatus,
} from "@/lib/battle-score";
import {
  rpcBattleHeartbeat,
  rpcCancelMatchmaking,
  rpcMatchmakingStatus,
  rpcStartMatchmaking,
  rpcSubmitBattleAnswer,
  rpcTickBattle,
  type BattleStateDto,
} from "@/lib/battle-api";
import { fetchOwnProfile } from "@/hooks/useProfile";
import { useGameStore } from "@/store/gameStore";
import type { AgeBand } from "@/lib/database.types";

export interface Rival {
  name: string;
  avatar: string;
  score: number;
  lastCorrect: boolean | null;
  userId?: string;
  connected?: boolean;
}

export interface BattleState {
  isPlaying: boolean;
  isSearching: boolean;
  isFinished: boolean;
  isLive: boolean;
  currentQuestionIndex: number;
  battleQuestions: Question[];
  score: number;
  streak: number;
  timer: number;
  hasAnswered: boolean;
  selectedAnswer: number | null;
  rivals: Rival[];
  subject: Subject | null;
  ageGroup: string | null;
  battleId: string | null;
  opponentLeft: boolean;
  reconnectSeconds: number | null;
  error: string | null;
  questionStartedAt: string | null;
  questionDurationMs: number;
  serverOffsetMs: number;

  startSearch: (subject: Subject, ageGroup: string) => void;
  submitAnswer: (index: number) => void;
  tickTimer: () => void;
  nextQuestion: () => void;
  resetBattle: () => void;
  cancelSearch: () => void;
}

const RIVAL_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Skyler"];

const emptyBattle = {
  isPlaying: false,
  isSearching: false,
  isFinished: false,
  isLive: false,
  currentQuestionIndex: 0,
  battleQuestions: [] as Question[],
  score: 0,
  streak: 0,
  timer: 10,
  hasAnswered: false,
  selectedAnswer: null as number | null,
  rivals: [] as Rival[],
  subject: null as Subject | null,
  ageGroup: null as string | null,
  battleId: null as string | null,
  opponentLeft: false,
  reconnectSeconds: null as number | null,
  error: null as string | null,
  questionStartedAt: null as string | null,
  questionDurationMs: 10000,
  serverOffsetMs: 0,
};

let botTimer: ReturnType<typeof setTimeout> | null = null;
let live: LiveSession | null = null;

export function disposeLiveBattle() {
  live?.dispose();
  live = null;
}

class LiveSession {
  disposed = false;
  battleId: string | null = null;
  myId: string | null = null;
  channel: RealtimeChannel | null = null;
  pollId: ReturnType<typeof setInterval> | null = null;
  heartbeatId: ReturnType<typeof setInterval> | null = null;
  submitting = false;
  lastAdvanceAt = 0;
  lastAnsweredQuestion: string | null = null;
  streak = 0;
  apply: (patch: Partial<BattleState>) => void;
  get: () => BattleState;

  constructor(apply: (patch: Partial<BattleState>) => void, get: () => BattleState) {
    this.apply = apply;
    this.get = get;
  }

  dispose() {
    this.disposed = true;
    if (this.pollId) window.clearInterval(this.pollId);
    if (this.heartbeatId) window.clearInterval(this.heartbeatId);
    this.pollId = null;
    this.heartbeatId = null;
    if (this.channel) {
      const supabase = getSupabase();
      void supabase?.removeChannel(this.channel);
    }
    this.channel = null;
  }

  async start(subject: Subject, ageGroup: string) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured");
    const { data } = await supabase.auth.getUser();
    this.myId = data.user?.id ?? null;
    if (!this.myId) throw new Error("not signed in");

    const result = await rpcStartMatchmaking(subject, ageGroup as AgeBand);
    if (this.disposed) return;
    if (result.battle_id) {
      await this.attach(result.battle_id);
      return;
    }
    this.pollId = window.setInterval(() => {
      void this.pollQueue();
    }, 1500);
    this.subscribeQueue();
  }

  subscribeQueue() {
    const supabase = getSupabase();
    if (!supabase || !this.myId) return;
    this.channel = supabase
      .channel(`matchmaking:${this.myId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "battle_players",
          filter: `user_id=eq.${this.myId}`,
        },
        (payload) => {
          const row = payload.new as { battle_id?: string };
          if (row.battle_id) void this.attach(row.battle_id);
        }
      )
      .subscribe();
  }

  async pollQueue() {
    if (this.disposed || this.battleId) return;
    try {
      const status = await rpcMatchmakingStatus();
      if (status.battle_id) await this.attach(status.battle_id);
    } catch {
      /* keep waiting */
    }
  }

  async attach(battleId: string) {
    if (this.disposed) return;
    if (this.battleId === battleId && this.get().isPlaying) return;
    this.battleId = battleId;
    if (this.pollId) {
      window.clearInterval(this.pollId);
      this.pollId = null;
    }
    const supabase = getSupabase();
    if (this.channel && supabase) {
      void supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (!supabase) return;

    this.channel = supabase
      .channel(`battle:${battleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "battles", filter: `id=eq.${battleId}` },
        () => {
          void this.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "battle_players", filter: `battle_id=eq.${battleId}` },
        () => {
          void this.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "battle_events", filter: `battle_id=eq.${battleId}` },
        () => {
          void this.refresh();
        }
      )
      .subscribe();

    if (this.heartbeatId) window.clearInterval(this.heartbeatId);
    this.heartbeatId = window.setInterval(() => {
      void this.heartbeat();
    }, 4000);
    await this.heartbeat();
  }

  async heartbeat() {
    if (this.disposed || !this.battleId) return;
    try {
      const dto = await rpcBattleHeartbeat(this.battleId);
      this.applyDto(dto);
    } catch {
      /* retry next beat */
    }
  }

  async refresh() {
    if (this.disposed || !this.battleId) return;
    try {
      const dto = await rpcTickBattle(this.battleId);
      this.applyDto(dto);
    } catch {
      /* ignore transient */
    }
  }

  async submit(index: number) {
    const state = this.get();
    if (!this.battleId || this.submitting || state.hasAnswered) return;
    const q = state.battleQuestions[state.currentQuestionIndex];
    if (!q) return;
    this.submitting = true;
    try {
      const dto = await rpcSubmitBattleAnswer(this.battleId, q.id, index);
      this.applyDto(dto);
    } catch {
      this.apply({ error: "Could not submit that answer. Trying again…" });
    } finally {
      this.submitting = false;
    }
  }

  applyDto(dto: BattleStateDto) {
    if (this.disposed) return;
    const me = this.myId;
    const serverNow = Date.parse(dto.server_now);
    const timer = battleTimerRemaining(dto.question_started_at, dto.question_duration_ms, serverNow);
    const mine = dto.players.find((p) => p.user_id === me);
    const others = dto.players.filter((p) => p.user_id !== me);
    const reconnect = others.reduce<number | null>((acc, p) => {
      if (p.connected) return acc;
      const left = battleReconnectSeconds(p.last_seen_at, serverNow);
      if (acc === null) return left;
      return Math.min(acc, left);
    }, null);

    const mapped: Question[] = [...dto.questions]
      .sort((a, b) => a.position - b.position)
      .map((q) => {
        const prev = this.get().battleQuestions.find((x) => x.id === q.id);
        const correct = q.correct_index ?? prev?.correctIndex ?? -1;
        const explanation = q.explanation ?? prev?.explanation ?? "";
        return {
          id: q.id,
          question: q.prompt,
          options: q.options,
          correctIndex: correct,
          explanation,
          subject: (this.get().subject ?? "math") as Subject,
          difficulty: "easy",
          ageGroup: (this.get().ageGroup ?? "9-12") as Question["ageGroup"],
        };
      });

    if (dto.my_answer) {
      const qid = dto.my_answer.question_id;
      const idx = mapped.findIndex((q) => q.id === qid);
      if (idx >= 0) {
        mapped[idx] = {
          ...mapped[idx],
          correctIndex: dto.my_answer.correct_index,
          explanation: dto.my_answer.explanation,
        };
      }
    }

    const finished = isBattleFinishedStatus(dto.status);
    const hasAnswered = Boolean(dto.my_answer) || dto.answering_over;
    const selected = dto.my_answer ? dto.my_answer.chosen_index : hasAnswered ? -1 : null;

    if (dto.my_answer && dto.my_answer.question_id !== this.lastAnsweredQuestion) {
      this.lastAnsweredQuestion = dto.my_answer.question_id;
      this.streak = dto.my_answer.is_correct ? this.streak + 1 : 0;
    }
    if (!dto.my_answer && !dto.answering_over) {
      this.lastAnsweredQuestion = null;
    }

    if (finished) {
      void this.hydrateProfile();
    }

    this.apply({
      isLive: true,
      isSearching: false,
      isPlaying: true,
      isFinished: finished,
      battleId: dto.battle_id,
      currentQuestionIndex: dto.current_index,
      battleQuestions: mapped,
      score: mine?.score ?? 0,
      streak: this.streak,
      timer,
      hasAnswered,
      selectedAnswer: selected,
      rivals: others.map((p) => ({
        name: p.username,
        avatar: p.avatar,
        score: p.score,
        lastCorrect: p.last_correct,
        userId: p.user_id,
        connected: p.connected,
      })),
      opponentLeft: dto.status === "forfeit",
      reconnectSeconds: finished ? null : reconnect,
      error: null,
      questionStartedAt: dto.question_started_at,
      questionDurationMs: dto.question_duration_ms,
      serverOffsetMs: serverNow - Date.now(),
    });
  }

  async hydrateProfile() {
    try {
      const row = await fetchOwnProfile();
      if (!row) return;
      useGameStore.getState().hydrateFromServer({
        name: row.username,
        avatar: row.avatar,
        xp: row.xp,
        level: row.level,
        coins: row.coins,
        streak: row.streak,
        quizzesCompleted: row.quizzes_completed,
        correctAnswers: row.correct_answers,
        totalAnswers: row.total_answers,
      });
    } catch {
      /* navbar will catch up via AuthHydrator */
    }
  }
}

export function createBattleActions(
  set: (patch: Partial<BattleState> | ((s: BattleState) => Partial<BattleState>)) => void,
  get: () => BattleState
) {
  const apply = (patch: Partial<BattleState>) => set(patch);

  const startBotSearch = (subject: Subject, ageGroup: string) => {
    if (botTimer) window.clearTimeout(botTimer);
    set({ ...emptyBattle, isSearching: true, isLive: false, subject, ageGroup });
    botTimer = window.setTimeout(() => {
      const filtered = bundled.filter((q: Question) => q.subject === subject && q.ageGroup === ageGroup);
      const pool = filtered.length >= 1 ? filtered : bundled.filter((q) => q.subject === subject);
      const selectedQuestions = shuffleArray(pool).slice(0, 5);
      const randomRivals: Rival[] = shuffleArray(RIVAL_NAMES)
        .slice(0, 2)
        .map((name: string) => ({
          name,
          avatar: avatars[Math.floor(Math.random() * avatars.length)],
          score: 0,
          lastCorrect: null,
        }));
      set({
        isPlaying: true,
        isSearching: false,
        isFinished: false,
        isLive: false,
        battleQuestions: selectedQuestions,
        currentQuestionIndex: 0,
        score: 0,
        streak: 0,
        timer: 10,
        hasAnswered: false,
        selectedAnswer: null,
        rivals: randomRivals,
      });
    }, 2500);
  };

  return {
    startSearch: (subject: Subject, ageGroup: string) => {
      disposeLiveBattle();
      if (!isLiveBattleEnabled()) {
        startBotSearch(subject, ageGroup);
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        set({ error: "You need a connection to enter a live battle." });
        return;
      }
      set({
        ...emptyBattle,
        isSearching: true,
        isLive: true,
        subject,
        ageGroup,
        error: null,
      });
      live = new LiveSession(apply, get);
      void live.start(subject, ageGroup).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Matchmaking failed";
        set({
          isSearching: false,
          isLive: true,
          error: message === "not signed in" ? "Sign in to enter a live battle." : message,
        });
      });
    },

    submitAnswer: (index: number) => {
      const state = get();
      if (state.hasAnswered) return;

      if (state.isLive && live) {
        void live.submit(index);
        return;
      }

      const currentQuestion = state.battleQuestions[state.currentQuestionIndex];
      if (!currentQuestion) return;
      const isCorrect = index === currentQuestion.correctIndex;
      const points = isCorrect ? 100 + Math.ceil(state.timer * 10) : 0;
      const updatedRivals = state.rivals.map((rival) => {
        const rivalCorrect = Math.random() > 0.35;
        const rivalPoints = rivalCorrect ? 100 + Math.floor(Math.random() * 100) : 0;
        return {
          ...rival,
          score: rival.score + rivalPoints,
          lastCorrect: rivalCorrect,
        };
      });
      set({
        hasAnswered: true,
        selectedAnswer: index,
        score: state.score + points,
        streak: isCorrect ? state.streak + 1 : 0,
        rivals: updatedRivals,
      });
    },

    tickTimer: () => {
      const state = get();
      if (!state.isPlaying || state.isFinished) return;

      if (state.isLive) {
        if (!state.questionStartedAt) return;
        const serverNow = Date.now() + state.serverOffsetMs;
        const remaining = battleTimerRemaining(
          state.questionStartedAt,
          state.questionDurationMs,
          serverNow
        );
        if (remaining !== state.timer) set({ timer: remaining });
        if (remaining <= 0 && !state.hasAnswered && live) {
          void live.submit(-1);
        }
        if (remaining <= 0 && live && Date.now() - live.lastAdvanceAt > 800) {
          live.lastAdvanceAt = Date.now();
          void live.refresh();
        }
        return;
      }

      if (state.hasAnswered) return;
      if (state.timer <= 0) {
        get().submitAnswer(-1);
      } else {
        set({ timer: Math.max(0, state.timer - 0.1) });
      }
    },

    nextQuestion: () => {
      const state = get();
      if (state.isLive) {
        void live?.refresh();
        return;
      }
      const last = state.battleQuestions.length - 1;
      if (state.currentQuestionIndex >= last) {
        set({ currentQuestionIndex: state.currentQuestionIndex + 1, isFinished: true });
      } else {
        set({
          currentQuestionIndex: state.currentQuestionIndex + 1,
          timer: 10,
          hasAnswered: false,
          selectedAnswer: null,
          rivals: state.rivals.map((r) => ({ ...r, lastCorrect: null })),
        });
      }
    },

    cancelSearch: () => {
      if (botTimer) {
        window.clearTimeout(botTimer);
        botTimer = null;
      }
      if (live) {
        void rpcCancelMatchmaking().catch(() => undefined);
      }
      disposeLiveBattle();
      set({ ...emptyBattle });
    },

    resetBattle: () => {
      if (botTimer) {
        window.clearTimeout(botTimer);
        botTimer = null;
      }
      if (live) {
        void rpcCancelMatchmaking().catch(() => undefined);
      }
      disposeLiveBattle();
      set({ ...emptyBattle });
    },
  };
}

export { emptyBattle };
