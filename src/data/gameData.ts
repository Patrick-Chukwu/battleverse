export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirement: string;
}

export const badges: Badge[] = [
  { id: "first-win", name: "First Victory", emoji: "🏆", description: "Complete your first quiz", requirement: "Complete 1 quiz" },
  { id: "speed-demon", name: "Speed Demon", emoji: "⚡", description: "Answer 5 questions in under 3 seconds each", requirement: "5 fast answers" },
  { id: "genius", name: "Genius", emoji: "🧠", description: "Get a perfect score on any quiz", requirement: "100% score" },
  { id: "streak-king", name: "Streak King", emoji: "🔥", description: "Get a 5-answer streak", requirement: "5 correct in a row" },
  { id: "explorer", name: "Explorer", emoji: "🧭", description: "Try all 6 subjects", requirement: "Play all subjects" },
  { id: "math-whiz", name: "Math Whiz", emoji: "🔢", description: "Score 100% on a math quiz", requirement: "Perfect math score" },
  { id: "tech-guru", name: "Tech Guru", emoji: "💻", description: "Score 100% on a tech quiz", requirement: "Perfect tech score" },
  { id: "ai-master", name: "AI Master", emoji: "🤖", description: "Score 100% on an AI quiz", requirement: "Perfect AI score" },
];

export const avatars = ["🦊", "🐱", "🐶", "🦁", "🐸", "🐼", "🦄", "🐲", "🦋", "🐙", "🦈", "🦅"];

export interface PlayerProfile {
  name: string;
  avatar: string;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  earnedBadges: string[];
  quizzesCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
}

export function getLevel(xp: number): { level: number; title: string; nextLevelXp: number; progress: number } {
  const levels = [
    { threshold: 0, title: "Beginner" },
    { threshold: 100, title: "Learner" },
    { threshold: 300, title: "Explorer" },
    { threshold: 600, title: "Challenger" },
    { threshold: 1000, title: "Pro" },
    { threshold: 1500, title: "Expert" },
    { threshold: 2500, title: "Master" },
    { threshold: 4000, title: "Legend" },
  ];
  
  let currentLevel = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].threshold) {
      currentLevel = i;
      break;
    }
  }
  
  const nextLevel = currentLevel < levels.length - 1 ? levels[currentLevel + 1] : levels[currentLevel];
  const currentThreshold = levels[currentLevel].threshold;
  const nextThreshold = nextLevel.threshold;
  const progress = nextThreshold > currentThreshold 
    ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100 
    : 100;
  
  return {
    level: currentLevel + 1,
    title: levels[currentLevel].title,
    nextLevelXp: nextThreshold,
    progress: Math.min(progress, 100),
  };
}

export const mockLeaderboard = [
  { name: "StarCoder", avatar: "🦊", xp: 3200, level: 7 },
  { name: "MathNinja", avatar: "🐱", xp: 2800, level: 6 },
  { name: "BrainStorm", avatar: "🦁", xp: 2100, level: 6 },
  { name: "QuizKing", avatar: "🐲", xp: 1800, level: 5 },
  { name: "TechWiz", avatar: "🦄", xp: 1500, level: 5 },
  { name: "AIExplorer", avatar: "🐼", xp: 1200, level: 4 },
  { name: "CodePup", avatar: "🐶", xp: 900, level: 4 },
  { name: "ScienceGal", avatar: "🦋", xp: 700, level: 3 },
  { name: "LogicBoy", avatar: "🐸", xp: 450, level: 3 },
  { name: "FactFinder", avatar: "🐙", xp: 200, level: 2 },
];
