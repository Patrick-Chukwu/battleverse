import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { subjects, type Subject, type Question } from "@/data/quizData";
import { useGameStore } from "@/store/gameStore";
import { Timer, CheckCircle2, XCircle, ArrowRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchExamPaper, paperToQuestions, type ExamPaper } from "@/lib/exam-api";
import { examPassed, examPercent, examXp, examLabel, formatPaperClock } from "@/lib/exam-score";
import { loadPracticeQuestions } from "@/lib/practice-questions";
import { enqueueOutbox } from "@/lib/practice-sync";
import { isServerProfileEnabled } from "@/lib/flags";
import { useSession } from "@/hooks/useSession";
import { practiceXp } from "@/lib/practice-score";

const answerClasses = ["answer-a", "answer-b", "answer-c", "answer-d"];
const answerLabels = ["A", "B", "C", "D"];

const QuizPage = () => {
  const { subjectId, testId } = useParams<{ subjectId?: string; testId?: string }>();
  const navigate = useNavigate();
  const examMode = Boolean(testId);
  const { addXp, addCoins, completeQuiz, earnBadge } = useGameStore();
  const { data: session } = useSession();
  const sessionIdRef = useRef(crypto.randomUUID());
  const finishedRef = useRef(false);
  const shouldSync = Boolean(session && isServerProfileEnabled());

  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [examError, setExamError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [chosen, setChosen] = useState<(number | null)[]>([]);

  const subject = subjects.find(s => s.id === subjectId);
  const showHints = !examMode || Boolean(paper?.hints_allowed);
  const paperSeconds = paper?.time_limit_s ?? 600;

  const resetSession = useCallback((nextQuestions: Question[], seconds: number) => {
    sessionIdRef.current = crypto.randomUUID();
    finishedRef.current = false;
    setQuestions(nextQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setTimeLeft(seconds);
    setIsFinished(false);
    setStreak(0);
    setAnswers([]);
    setChosen(nextQuestions.map(() => null));
  }, []);

  useEffect(() => {
    if (testId) {
      setExamError(null);
      setPaper(null);
      void fetchExamPaper(testId)
        .then((row) => {
          if (!row) {
            setExamError("This paper is not on this device. Connect and sync, then try again.");
            return;
          }
          const loaded = paperToQuestions(row);
          if (loaded.length === 0) {
            setExamError("This paper has no published questions yet.");
            return;
          }
          setPaper(row);
          resetSession(loaded, row.time_limit_s ?? 600);
        })
        .catch((err: unknown) => {
          setExamError(err instanceof Error ? err.message : "Could not load this paper.");
        });
      return;
    }
    if (!subjectId) return;
    void loadPracticeQuestions(subjectId as Subject).then((rows) => resetSession(rows, 15));
  }, [subjectId, testId, resetSession]);

  const enqueueAttempt = useCallback((question: Question, index: number, timeLeftForXp: number) => {
    if (!shouldSync) return;
    const attemptId = crypto.randomUUID();
    void enqueueOutbox({
      id: attemptId,
      type: "attempt",
      payload: {
        id: attemptId,
        question_id: question.id,
        chosen_index: index,
        time_left: timeLeftForXp,
        ...(testId ? { test_id: testId } : {}),
      },
    });
  }, [shouldSync, testId]);

  const finishQuiz = useCallback((finalChosen: (number | null)[], finalAnswers: boolean[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsFinished(true);

    const correct = examMode
      ? questions.filter((q, i) => finalChosen[i] === q.correctIndex).length
      : finalAnswers.filter(Boolean).length;
    const total = questions.length;
    const xpTotal = examMode
      ? questions.reduce((sum, q, i) => sum + examXp(finalChosen[i] === q.correctIndex), 0)
      : score;

    if (examMode) {
      setScore(xpTotal);
      addXp(xpTotal);
      addCoins(Math.floor(xpTotal / 5));
    } else {
      addXp(score);
      addCoins(Math.floor(score / 5));
    }
    completeQuiz(correct, total);

    if (correct === total && total > 0) {
      earnBadge("genius");
      const subjectForBadge = examMode ? questions[0]?.subject : subjectId;
      if (subjectForBadge === "math") earnBadge("math-whiz");
      if (subjectForBadge === "tech") earnBadge("tech-guru");
      if (subjectForBadge === "ai") earnBadge("ai-master");
    }
    earnBadge("first-win");

    if (shouldSync) {
      void enqueueOutbox({
        id: sessionIdRef.current,
        type: "finish",
        payload: {
          id: sessionIdRef.current,
          subject_id: examMode ? (questions[0]?.subject ?? "general") : subjectId,
          correct,
          total,
        },
      });
    }
  }, [addCoins, addXp, completeQuiz, earnBadge, examMode, questions, score, shouldSync, subjectId]);

  const handleAnswer = useCallback((index: number) => {
    if (showFeedback || selectedAnswer !== null) return;
    const current = questions[currentIndex];
    if (!current) return;
    setSelectedAnswer(index);

    const isCorrect = index === current.correctIndex;
    if (examMode) {
      setChosen((prev) => {
        const next = [...prev];
        next[currentIndex] = index;
        return next;
      });
      enqueueAttempt(current, index, 0);
      if (showHints) {
        setShowFeedback(true);
        setStreak((s) => (isCorrect ? s + 1 : 0));
      }
      return;
    }

    setShowFeedback(true);
    const xpGain = practiceXp(timeLeft, isCorrect);
    if (isCorrect) {
      setScore((s) => s + xpGain);
      setStreak((s) => s + 1);
      setAnswers((a) => [...a, true]);
    } else {
      setStreak(0);
      setAnswers((a) => [...a, false]);
    }
    enqueueAttempt(current, index, timeLeft);
  }, [showFeedback, selectedAnswer, currentIndex, questions, timeLeft, shouldSync, examMode, showHints, enqueueAttempt]);

  const finishFromTimeout = useCallback(() => {
    const nextChosen = [...chosen];
    questions.forEach((q, i) => {
      if (nextChosen[i] == null) {
        nextChosen[i] = -1;
        enqueueAttempt(q, -1, 0);
      }
    });
    setChosen(nextChosen);
    finishQuiz(nextChosen, answers);
  }, [answers, chosen, enqueueAttempt, finishQuiz, questions]);

  useEffect(() => {
    if (isFinished || questions.length === 0) return;
    if (!examMode && showFeedback) return;
    const timer = setTimeout(() => {
      if (timeLeft <= 1) {
        if (examMode) finishFromTimeout();
        else handleAnswer(-1);
      } else {
        setTimeLeft((t) => t - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showFeedback, isFinished, questions.length, handleAnswer, examMode, finishFromTimeout]);

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      if (examMode) {
        const nextChosen = [...chosen];
        if (selectedAnswer !== null) nextChosen[currentIndex] = selectedAnswer;
        finishQuiz(nextChosen, answers);
      } else {
        finishQuiz(chosen, answers);
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      if (!examMode) setTimeLeft(15);
    }
  };

  if (examError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-24">
        <div className="glass-card max-w-lg rounded-3xl p-10 text-center">
          <p className="mb-6 text-xl font-black">{examError}</p>
          <button
            type="button"
            onClick={() => navigate("/exams")}
            className="rounded-2xl bg-primary px-8 py-3 font-black text-primary-foreground"
          >
            Back to exam papers
          </button>
        </div>
      </div>
    );
  }

  if ((!examMode && !subject) || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pt-24">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-7xl mb-6"
          >
            🎮
          </motion.div>
          <p className="text-2xl font-black text-muted-foreground">
            {examMode ? "Loading paper..." : "Loading quiz..."}
          </p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const finalCorrect = examMode
      ? questions.filter((q, i) => chosen[i] === q.correctIndex).length
      : answers.filter(Boolean).length;
    const percentage = examPercent(finalCorrect, questions.length);
    const passed = examMode ? examPassed(finalCorrect, questions.length, paper?.pass_mark_pct) : percentage >= 50;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-24 pb-16">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="glass-card w-full max-w-lg rounded-3xl p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
            className="text-8xl mb-6"
          >
            {examMode ? (passed ? "✅" : "📋") : percentage >= 80 ? "🏆" : percentage >= 50 ? "⭐" : "💪"}
          </motion.div>
          <h2 className="mb-3 text-4xl font-black">
            {examMode
              ? passed ? "You passed!" : "Below the pass mark"
              : percentage >= 80 ? "Amazing!" : percentage >= 50 ? "Good Job!" : "Keep Trying!"}
          </h2>
          <p className="mb-10 text-xl font-bold text-muted-foreground">
            You scored {finalCorrect} out of {questions.length}
            {examMode ? ` · Pass mark ${paper?.pass_mark_pct ?? 50}%` : ""}
          </p>

          <div className="mb-10 grid grid-cols-2 gap-6">
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6">
              <p className="text-4xl font-black text-primary">{score}</p>
              <p className="mt-1 text-sm font-black text-primary/70">XP Earned</p>
            </div>
            <div className="rounded-3xl border border-game-orange/20 bg-game-orange/10 p-6">
              <p className="text-4xl font-black text-game-orange">{percentage}%</p>
              <p className="mt-1 text-sm font-black text-game-orange/70">
                {examMode ? (passed ? "Passed" : "Accuracy") : "Accuracy"}
              </p>
            </div>
          </div>

          {examMode && (
            <div className="mb-8 max-h-64 space-y-3 overflow-y-auto text-left">
              {questions.map((q, i) => {
                const pick = chosen[i];
                const ok = pick === q.correctIndex;
                return (
                  <div key={q.id} className="rounded-2xl border border-border bg-card/80 p-4">
                    <p className="mb-1 text-sm font-black">
                      {ok ? "✅" : "❌"} {i + 1}. {q.question}
                    </p>
                    <p className="flex items-start gap-2 text-sm font-bold text-muted-foreground">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-game-orange" />
                      {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (examMode && paper) {
                  resetSession(questions, paperSeconds);
                  return;
                }
                void loadPracticeQuestions(subjectId as Subject).then((rows) => resetSession(rows, 15));
              }}
              className="rounded-2xl bg-primary px-8 py-4 text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all"
            >
              Play Again 🔄
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(examMode ? "/exams" : "/subjects")}
              className="rounded-2xl bg-muted px-8 py-4 text-lg font-black text-muted-foreground transition-all hover:bg-muted/80"
            >
              {examMode ? "More exam papers" : "Try Another Subject"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isCorrect = selectedAnswer === question.correctIndex;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const waitingForNext = examMode && !showHints && selectedAnswer !== null;

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-8">
      <div className="mx-auto w-full max-w-[672px]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2 shadow-game">
            <span className="text-2xl">{examMode ? "📝" : subject?.emoji}</span>
            <span className="font-black">
              {examMode ? paper?.title ?? "Exam paper" : subject?.name}
            </span>
          </div>
          <div className="flex items-center gap-6">
            {examMode && (
              <span className="text-sm font-black tracking-widest text-primary uppercase">
                {examLabel(paper?.exam_type_id ?? "custom")}
              </span>
            )}
            {!examMode && streak >= 2 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-lg font-black text-game-orange"
              >
                🔥 {streak} STREAK!
              </motion.span>
            )}
            {!examMode && <span className="text-2xl font-black text-primary">{score} XP</span>}
          </div>
        </div>

        <div className="mb-10 flex items-center gap-4">
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted shadow-inner">
            <motion.div
              className="h-full rounded-full bg-primary shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_50%,transparent)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, type: "spring" }}
            />
          </div>
          <div className="flex min-w-[100px] items-center justify-center gap-2 rounded-full bg-card px-6 py-2 shadow-game">
            <Timer className={cn("h-5 w-5", timeLeft <= 5 ? "animate-pulse text-destructive" : "text-primary")} />
            <span className={cn("text-xl font-black tabular-nums", timeLeft <= 5 ? "text-destructive" : "")}>
              {examMode ? formatPaperClock(timeLeft) : `${timeLeft}s`}
            </span>
          </div>
        </div>

        <p className="mb-6 text-center text-lg font-black tracking-widest text-muted-foreground uppercase">
          Question {currentIndex + 1} of {questions.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
          >
            <div className="glass-card mb-8 rounded-3xl p-8 text-center sm:p-12">
              <h2 className="text-2xl font-black sm:text-3xl">
                {question.question}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {question.options.map((option, i) => {
                let stateClass = "";

                if (showFeedback) {
                  if (i === question.correctIndex) {
                    stateClass = "!bg-success !border-success !text-success-foreground";
                  } else if (i === selectedAnswer && !isCorrect) {
                    stateClass = "!bg-destructive !border-destructive !text-destructive-foreground";
                  } else {
                    stateClass = "opacity-50";
                  }
                } else if (waitingForNext && i === selectedAnswer) {
                  stateClass = "ring-2 ring-primary";
                }

                return (
                  <motion.button
                    key={i}
                    whileHover={!showFeedback && selectedAnswer === null ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!showFeedback && selectedAnswer === null ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(i)}
                    disabled={showFeedback || selectedAnswer !== null}
                    className={cn(
                      "answer-option",
                      answerClasses[i],
                      stateClass
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/40 text-sm font-black">
                      {answerLabels[i]}
                    </span>
                    <span className="flex-1">{option}</span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-10"
                >
                  <div className={cn(
                    "flex items-start gap-6 rounded-3xl border-2 p-8 shadow-game",
                    isCorrect
                      ? "border-success/30 bg-success/10 text-foreground"
                      : "border-destructive/30 bg-destructive/10 text-foreground"
                  )}>
                    <div className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-lg",
                      isCorrect ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                    )}>
                      {isCorrect ? <CheckCircle2 className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
                    </div>
                    <div>
                      <p className="mb-2 text-3xl font-black">
                        {isCorrect ? "Correct! 🎉" : "Not quite! 😊"}
                      </p>
                      <p className="flex items-start gap-2 text-lg font-bold leading-relaxed opacity-80">
                        <Lightbulb className="mt-1 h-6 w-6 shrink-0 text-game-orange" />
                        {question.explanation}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextQuestion}
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-3 text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all"
                  >
                    {currentIndex + 1 >= questions.length ? "See Results 🏆" : "Next Question"}
                    <ArrowRight className="w-8 h-8" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {waitingForNext && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextQuestion}
                className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-3 text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all"
              >
                {currentIndex + 1 >= questions.length ? "Submit paper 🏆" : "Next Question"}
                <ArrowRight className="w-8 h-8" />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;
