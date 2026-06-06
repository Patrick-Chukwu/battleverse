import { create } from 'zustand';
import { questions, shuffleArray, type Question, type Subject } from '@/data/quizData';
import { avatars } from '@/data/gameData';

interface Rival {
  name: string;
  avatar: string;
  score: number;
  lastCorrect: boolean | null;
}

interface BattleState {
  isPlaying: boolean;
  isSearching: boolean;
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

  startSearch: (subject: Subject, ageGroup: string) => void;
  submitAnswer: (index: number) => void;
  tickTimer: () => void;
  nextQuestion: () => void;
  resetBattle: () => void;
}

const RIVAL_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Skyler"];

export const useBattleStore = create<BattleState>((set, get) => ({
  isPlaying: false,
  isSearching: false,
  currentQuestionIndex: 0,
  battleQuestions: [],
  score: 0,
  streak: 0,
  timer: 10,
  hasAnswered: false,
  selectedAnswer: null,
  rivals: [],
  subject: null,
  ageGroup: null,

  startSearch: (subject, ageGroup) => {
    set({ isSearching: true, isPlaying: false, subject, ageGroup });
    
    // Simulate matchmaking
    setTimeout(() => {
      const filtered = questions.filter((q: Question) => q.subject === subject && q.ageGroup === ageGroup);
      const selectedQuestions = shuffleArray(filtered).slice(0, 5);
      
      const randomRivals: Rival[] = shuffleArray(RIVAL_NAMES)
        .slice(0, 2)
        .map((name: string) => ({
          name,
          avatar: avatars[Math.floor(Math.random() * avatars.length)],
          score: 0,
          lastCorrect: null
        }));

      set({
        isPlaying: true,
        isSearching: false,
        battleQuestions: selectedQuestions,
        currentQuestionIndex: 0,
        score: 0,
        streak: 0,
        timer: 10,
        hasAnswered: false,
        selectedAnswer: null,
        rivals: randomRivals
      });
    }, 2500);
  },

  submitAnswer: (index) => {
    const { battleQuestions, currentQuestionIndex, timer, streak, rivals, hasAnswered } = get();
    if (hasAnswered) return;

    const currentQuestion = battleQuestions[currentQuestionIndex];
    const isCorrect = index === currentQuestion.correctIndex;
    
    // Calculate score: base 100 + speed bonus (time * 10)
    const points = isCorrect ? 100 + Math.ceil(timer * 10) : 0;
    
    // Update rivals
    const updatedRivals = rivals.map(rival => {
      const rivalCorrect = Math.random() > 0.35; // ~65% accuracy
      const rivalPoints = rivalCorrect ? 100 + Math.floor(Math.random() * 100) : 0;
      return {
        ...rival,
        score: rival.score + rivalPoints,
        lastCorrect: rivalCorrect
      };
    });

    set(state => ({
      hasAnswered: true,
      selectedAnswer: index,
      score: state.score + points,
      streak: isCorrect ? streak + 1 : 0,
      rivals: updatedRivals
    }));
  },

  tickTimer: () => {
    const { timer, hasAnswered, isPlaying } = get();
    if (hasAnswered || !isPlaying) return;

    if (timer <= 0) {
      get().submitAnswer(-1); // Force timeout
    } else {
      set({ timer: Math.max(0, timer - 0.1) });
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, battleQuestions } = get();
    if (currentQuestionIndex >= battleQuestions.length - 1) {
      // End of battle - we keep isPlaying true for the results screen 
      // which we'll handle in the component by checking index
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    } else {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        timer: 10,
        hasAnswered: false,
        selectedAnswer: null,
        rivals: get().rivals.map(r => ({ ...r, lastCorrect: null }))
      });
    }
  },

  resetBattle: () => {
    set({
      isPlaying: false,
      isSearching: false,
      currentQuestionIndex: 0,
      battleQuestions: [],
      score: 0,
      streak: 0,
      timer: 10,
      hasAnswered: false,
      selectedAnswer: null,
      rivals: [],
      subject: null,
      ageGroup: null
    });
  }
}));
