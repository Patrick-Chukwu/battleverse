import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { AuthHydrator } from "@/components/auth/AuthHydrator";
import { InviteToaster } from "@/components/invite/InviteToaster";
import { PresenceTracker } from "@/components/invite/PresenceTracker";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PracticeSync } from "@/components/PracticeSync";
import HomePage from "./pages/HomePage";
import SubjectsPage from "./pages/SubjectsPage";
import QuizPage from "./pages/QuizPage";
import ExamsPage from "./pages/ExamsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import BattlePage from "./pages/BattlePage";
import LoginPage from "./pages/LoginPage";
import LegalPage from "./pages/LegalPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthHydrator />
        <PresenceTracker />
        <InviteToaster />
        <PracticeSync />
        <Navbar />
        <OfflineBanner />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/quiz/:subjectId" element={<QuizPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/exam/:testId" element={<QuizPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
