import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionsBySubject, shuffleArray, subjects, type Subject, type Question } from "@/data/quizData";
import { useGameStore } from "@/store/gameStore";
import { Timer, CheckCircle2, XCircle, ArrowRight, Lightbulb } from "lucide-react";

const answerColors = ["answer-a", "answer-b", "answer-c", "answer-d"];
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
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎮</div>
          <p className="text-xl font-bold text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const finalCorrect = answers.filter(Boolean).length;
    const percentage = Math.round((finalCorrect / questions.length) * 100);
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="glass-card rounded-3xl p-10 max-w-md w-full mx-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-7xl mb-4"
          >
            {percentage >= 80 ? "🏆" : percentage >= 50 ? "⭐" : "💪"}
          </motion.div>
          <h2 className="text-3xl font-black mb-2">
            {percentage >= 80 ? "Amazing!" : percentage >= 50 ? "Good Job!" : "Keep Trying!"}
          </h2>
          <p className="text-muted-foreground font-semibold mb-6">
            You scored {finalCorrect} out of {questions.length}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-primary/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-primary">{score}</p>
              <p className="text-sm text-muted-foreground font-semibold">XP Earned</p>
            </div>
            <div className="bg-game-orange/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-game-orange">{percentage}%</p>
              <p className="text-sm text-muted-foreground font-semibold">Accuracy</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
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
              className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all"
            >
              Play Again 🔄
            </button>
            <button
              onClick={() => navigate("/subjects")}
              className="bg-muted text-foreground px-6 py-3 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all"
            >
              Try Another Subject
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isCorrect = selectedAnswer === question.correctIndex;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{subject.emoji}</span>
            <span className="font-bold text-sm text-muted-foreground">{subject.name}</span>
          </div>
          <div className="flex items-center gap-4">
            {streak >= 2 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm font-black text-game-orange">
                🔥 {streak} streak!
              </motion.span>
            )}
            <span className="font-black text-primary">{score} XP</span>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full h-3 bg-muted rounded-full mb-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-game-purple rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-sm text-muted-foreground font-semibold mb-6 text-center">
          Question {currentIndex + 1} of {questions.length}
        </p>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <motion.div
            className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-lg ${
              timeLeft <= 5 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            }`}
            animate={timeLeft <= 5 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
          >
            <Timer className="w-5 h-5" />
            {timeLeft}s
          </motion.div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glass-card rounded-3xl p-8 mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-black">{question.question}</h2>
            </div>

            {/* Answers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.map((option, i) => {
                let stateClass = "";
                if (showFeedback) {
                  if (i === question.correctIndex) stateClass = "!bg-success !border-success !text-success-foreground";
                  else if (i === selectedAnswer && !isCorrect) stateClass = "!bg-destructive !border-destructive !text-destructive-foreground";
                  else stateClass = "opacity-50";
                }

                return (
                  <motion.button
                    key={i}
                    whileHover={!showFeedback ? { scale: 1.02 } : {}}
                    whileTap={!showFeedback ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(i)}
                    disabled={showFeedback}
                    className={`answer-option ${answerColors[i]} ${stateClass}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center text-sm font-black shrink-0">
                        {answerLabels[i]}
                      </span>
                      <span className="text-left">{option}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-6"
                >
                  <div className={`rounded-2xl p-5 flex items-start gap-3 ${
                    isCorrect ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
                  }`}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-black text-lg mb-1">
                        {isCorrect ? "Correct! 🎉" : "Not quite! 😊"}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
                        {question.explanation}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={nextQuestion}
                    className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {currentIndex + 1 >= questions.length ? "See Results 🏆" : "Next Question"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
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
