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
      <div className="page-shell flex items-center justify-center bg-background">
        <p className="text-center text-xl font-black text-muted-foreground">
          Exam papers need the Battleverse backend.
        </p>
      </div>
    );
  }

  return (
    <div className="page-shell bg-background">
      <div className="mx-auto w-full max-w-[864px]">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 text-center sm:mb-12">
          <h1 className="text-title mb-2 font-black tracking-tight">Exam papers 📝</h1>
          <p className="text-base font-bold text-muted-foreground sm:text-xl">
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
              className="glass-card group flex cursor-pointer items-start gap-4 rounded-3xl border-2 border-transparent p-5 text-left transition-all hover:border-primary/30 sm:min-h-[160px] sm:items-center sm:gap-6 sm:p-8"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-16 sm:w-16">
                <ClipboardList className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-black tracking-widest text-primary uppercase">
                  {examLabel(paper.exam_type_id)}
                </p>
                <h2 className="mb-2 text-xl font-black sm:text-2xl">{paper.title}</h2>
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
