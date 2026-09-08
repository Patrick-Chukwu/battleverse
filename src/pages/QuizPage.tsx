import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionsBySubject, shuffleArray, subjects, type Subject, type Question } from "@/data/quizData";
import { useGameStore } from "@/store/gameStore";
import { Timer, CheckCircle2, XCircle, ArrowRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const answerClasses = ["answer-a", "answer-b", "answer-c", "answer-d"];
const answerLabels = ["A", "B", "C", "D"];

const QuizPage = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { addXp, addCoins, completeQuiz, earnBadge } = useGameStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const subject = subjects.find(s => s.id === subjectId);

  useEffect(() => {
    if (subjectId) {
      const qs = shuffleArray(getQuestionsBySubject(subjectId as Subject)).slice(0, 8);
      setQuestions(qs);
    }
  }, [subjectId]);

  useEffect(() => {
    if (showFeedback || isFinished || questions.length === 0) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showFeedback, isFinished, questions.length]);

  const handleAnswer = useCallback((index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    setShowFeedback(true);

    const isCorrect = index === questions[currentIndex].correctIndex;
    if (isCorrect) {
      const xpGain = 10 + Math.floor(timeLeft * 2);
      setScore(s => s + xpGain);
      setStreak(s => s + 1);
      setAnswers(a => [...a, true]);
    } else {
      setStreak(0);
      setAnswers(a => [...a, false]);
    }
  }, [showFeedback, currentIndex, questions, timeLeft]);

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeLeft(15);
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    const correct = answers.filter(Boolean).length + (selectedAnswer === questions[currentIndex]?.correctIndex ? 1 : 0);
    const total = questions.length;
    
    addXp(score);
    addCoins(Math.floor(score / 5));
    completeQuiz(correct, total);
    
    if (correct === total) {
      earnBadge("genius");
      if (subjectId === "math") earnBadge("math-whiz");
      if (subjectId === "tech") earnBadge("tech-guru");
      if (subjectId === "ai") earnBadge("ai-master");
    }
    earnBadge("first-win");
  };

  if (!subject || questions.length === 0) {
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
          <p className="text-2xl font-black text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const finalCorrect = answers.filter(Boolean).length;
    const percentage = Math.round((finalCorrect / questions.length) * 100);
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
            {percentage >= 80 ? "🏆" : percentage >= 50 ? "⭐" : "💪"}
          </motion.div>
          <h2 className="mb-3 text-4xl font-black">
            {percentage >= 80 ? "Amazing!" : percentage >= 50 ? "Good Job!" : "Keep Trying!"}
          </h2>
          <p className="mb-10 text-xl font-bold text-muted-foreground">
            You scored {finalCorrect} out of {questions.length}
          </p>

          <div className="mb-10 grid grid-cols-2 gap-6">
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6">
              <p className="text-4xl font-black text-primary">{score}</p>
              <p className="mt-1 text-sm font-black text-primary/70">XP Earned</p>
            </div>
            <div className="rounded-3xl border border-game-orange/20 bg-game-orange/10 p-6">
              <p className="text-4xl font-black text-game-orange">{percentage}%</p>
              <p className="mt-1 text-sm font-black text-game-orange/70">Accuracy</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setShowFeedback(false);
                setScore(0);
                setTimeLeft(15);
                setIsFinished(false);
                setStreak(0);
                setAnswers([]);
                setQuestions(shuffleArray(getQuestionsBySubject(subjectId as Subject)).slice(0, 8));
              }}
              className="rounded-2xl bg-primary px-8 py-4 text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all"
            >
              Play Again 🔄
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/subjects")}
              className="rounded-2xl bg-muted px-8 py-4 text-lg font-black text-muted-foreground transition-all hover:bg-muted/80"
            >
              Try Another Subject
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isCorrect = selectedAnswer === question.correctIndex;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-8">
      <div className="mx-auto max-w-3xl">
        {/* Header Info */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2 shadow-game">
            <span className="text-2xl">{subject.emoji}</span>
            <span className="font-black">{subject.name}</span>
          </div>
          <div className="flex items-center gap-6">
            {streak >= 2 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-lg font-black text-game-orange"
              >
                🔥 {streak} STREAK!
              </motion.span>
            )}
            <span className="text-2xl font-black text-primary">{score} XP</span>
          </div>
        </div>

        {/* Progress & Timer Bar */}
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
              {timeLeft}s
            </span>
          </div>
        </div>

        <p className="mb-6 text-center text-lg font-black tracking-widest text-muted-foreground uppercase">
          Question {currentIndex + 1} of {questions.length}
        </p>

        {/* Question Card */}
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

            {/* Answers 2x2 Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {question.options.map((option, i) => {
                let stateClass = "";

                if (showFeedback) {
                  if (i === question.correctIndex) {
                    stateClass = "!bg-success !border-success !text-success-foreground";
                  }
                  else if (i === selectedAnswer && !isCorrect) {
                    stateClass = "!bg-destructive !border-destructive !text-destructive-foreground";
                  }
                  else {
                    stateClass = "opacity-50";
                  }
                }

                return (
                  <motion.button
                    key={i}
                    whileHover={!showFeedback ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!showFeedback ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(i)}
                    disabled={showFeedback}
                    className={cn(
                      "answer-option",
                      answerClasses[i],
                      stateClass
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/40 text-lg font-black">
                      {answerLabels[i]}
                    </span>
                    <span className="flex-1">{option}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback Notification */}
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;
