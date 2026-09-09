import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardList } from "lucide-react";
import { fetchPublishedTests, type ExamPaper } from "@/lib/exam-api";
import { examLabel, formatPaperClock } from "@/lib/exam-score";
import { isExamModesEnabled } from "@/lib/flags";

const ExamsPage = () => {
  const navigate = useNavigate();
  const enabled = isExamModesEnabled();
  const [papers, setPapers] = useState<ExamPaper[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    void fetchPublishedTests()
      .then((rows) => {
        setPapers(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load exam papers.");
        setPapers([]);
      });
  }, [enabled]);

  if (!enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-24">
        <p className="text-center text-xl font-black text-muted-foreground">
          Exam papers need the Battleverse backend.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-16">
      <div className="mx-auto w-full max-w-[864px]">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-black tracking-tight">Exam papers 📝</h1>
          <p className="text-xl font-bold text-muted-foreground">
            Timed mocks. No hints until you submit. Pass mark on the report.
          </p>
        </motion.div>

        {error && (
          <p className="mb-6 text-center font-bold text-destructive">{error}</p>
        )}

        {papers === null && (
          <p className="text-center text-lg font-black text-muted-foreground">Loading papers…</p>
        )}

        {papers && papers.length === 0 && !error && (
          <p className="text-center text-lg font-black text-muted-foreground">
            No published papers yet. An admin can create one in the CMS.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {(papers ?? []).map((paper, i) => (
            <motion.button
              key={paper.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/exam/${paper.id}`)}
              className="glass-card group flex min-h-[160px] cursor-pointer items-center gap-6 rounded-3xl border-2 border-transparent p-8 text-left transition-all hover:border-primary/30"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ClipboardList className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs font-black tracking-widest text-primary uppercase">
                  {examLabel(paper.exam_type_id)}
                </p>
                <h2 className="mb-2 text-2xl font-black">{paper.title}</h2>
                <p className="font-bold text-muted-foreground">
                  {paper.question_ids?.length || paper.question_count} questions
                  {" · "}
                  {paper.time_limit_s ? formatPaperClock(paper.time_limit_s) : "Untimed"}
                  {" · "}
                  Pass {paper.pass_mark_pct ?? 50}%
                  {paper.offline_pack ? " · Offline ready" : ""}
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm font-black text-primary">
                  Start paper <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamsPage;
