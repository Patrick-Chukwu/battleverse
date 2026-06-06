import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionsBySubject, shuffleArray, subjects, type Subject, type Question } from "@/data/quizData";
import { useGameStore } from "@/store/gameStore";
import { Timer, CheckCircle2, XCircle, ArrowRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const answerColors = [
  "bg-blue-500 hover:bg-blue-600 border-blue-700",
  "bg-emerald-500 hover:bg-emerald-600 border-emerald-700",
  "bg-amber-500 hover:bg-amber-600 border-amber-700",
  "bg-rose-500 hover:bg-rose-600 border-rose-700",
];

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
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-7xl mb-6"
          >
            🎮
          </motion.div>
          <p className="text-2xl font-black text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const finalCorrect = answers.filter(Boolean).length;
    const percentage = Math.round((finalCorrect / questions.length) * 100);
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#F8F9FA] px-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl shadow-gray-200/50 border border-gray-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
            className="text-8xl mb-6"
          >
            {percentage >= 80 ? "🏆" : percentage >= 50 ? "⭐" : "💪"}
          </motion.div>
          <h2 className="text-4xl font-black mb-3 text-gray-900">
            {percentage >= 80 ? "Amazing!" : percentage >= 50 ? "Good Job!" : "Keep Trying!"}
          </h2>
          <p className="text-xl text-gray-500 font-bold mb-10">
            You scored {finalCorrect} out of {questions.length}
          </p>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100/50">
              <p className="text-4xl font-black text-indigo-600">{score}</p>
              <p className="text-sm text-indigo-400 font-black uppercase tracking-wider mt-1">XP Earned</p>
            </div>
            <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100/50">
              <p className="text-4xl font-black text-amber-600">{percentage}%</p>
              <p className="text-sm text-amber-400 font-black uppercase tracking-wider mt-1">Accuracy</p>
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
              className="bg-primary text-white px-8 py-5 rounded-2xl text-xl font-black shadow-xl shadow-indigo-500/20 transition-all"
            >
              Play Again 🔄
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/subjects")}
              className="bg-gray-100 text-gray-600 px-8 py-5 rounded-2xl text-xl font-black hover:bg-gray-200 transition-all"
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
    <div className="min-h-screen pt-24 pb-8 px-4 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto">
        {/* Header Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-2xl">{subject.emoji}</span>
            <span className="font-black text-gray-700">{subject.name}</span>
          </div>
          <div className="flex items-center gap-6">
            {streak >= 2 && (
              <motion.span 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="text-lg font-black text-amber-500 flex items-center gap-1"
              >
                🔥 {streak} STREAK!
              </motion.span>
            )}
            <span className="font-black text-primary text-2xl">{score} XP</span>
          </div>
        </div>

        {/* Progress & Timer Bar */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, type: "spring" }}
            />
          </div>
          <div className="flex items-center gap-2 bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100 min-w-[100px] justify-center">
            <Timer className={cn("w-5 h-5", timeLeft <= 5 ? "text-rose-500 animate-pulse" : "text-primary")} />
            <span className={cn("text-xl font-black tabular-nums", timeLeft <= 5 ? "text-rose-500" : "text-gray-900")}>
              {timeLeft}s
            </span>
          </div>
        </div>

        <p className="text-lg text-gray-400 font-black mb-6 text-center uppercase tracking-widest">
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
            <div className="bg-white rounded-[3rem] p-12 sm:p-20 mb-8 text-center shadow-xl shadow-gray-200/50 border border-gray-100">
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">
                {question.question}
              </h2>
            </div>

            {/* Answers 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {question.options.map((option, i) => {
                let stateClass = "";
                let shadowClass = "shadow-[0_6px_0_rgba(0,0,0,0.15)]";
                
                if (showFeedback) {
                  if (i === question.correctIndex) {
                    stateClass = "!bg-emerald-500 !border-emerald-700 !text-white";
                    shadowClass = "shadow-[0_6px_0_#065f46]";
                  }
                  else if (i === selectedAnswer && !isCorrect) {
                    stateClass = "!bg-rose-500 !border-rose-700 !text-white opacity-100";
                    shadowClass = "shadow-[0_6px_0_#9f1239]";
                  }
                  else {
                    stateClass = "opacity-40 grayscale-[0.5]";
                  }
                }

                return (
                  <motion.button
                    key={i}
                    whileHover={!showFeedback ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!showFeedback ? { scale: 0.98, y: 4 } : {}}
                    onClick={() => handleAnswer(i)}
                    disabled={showFeedback}
                    className={cn(
                      "relative flex items-center gap-4 p-6 sm:p-8 rounded-3xl text-xl font-black text-white text-left transition-all border-b-0",
                      answerColors[i],
                      shadowClass,
                      stateClass,
                      !showFeedback && "active:translate-y-1 active:shadow-none"
                    )}
                  >
                    <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0 shadow-inner">
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
                    "rounded-[2.5rem] p-8 flex items-start gap-6 border-2 shadow-xl shadow-gray-200/50",
                    isCorrect 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                      isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    )}>
                      {isCorrect ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                    </div>
                    <div>
                      <p className="font-black text-3xl mb-2">
                        {isCorrect ? "Correct! 🎉" : "Not quite! 😊"}
                      </p>
                      <p className="text-lg font-bold opacity-80 flex items-start gap-2 leading-relaxed">
                        <Lightbulb className="w-6 h-6 shrink-0 mt-1 text-amber-500" />
                        {question.explanation}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextQuestion}
                    className="w-full mt-8 bg-primary text-white py-6 rounded-3xl font-black text-2xl shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-3"
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
