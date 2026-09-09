import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  rpcAdminListQuestions,
  rpcAdminSetQuestionStatus,
  rpcAdminUpsertQuestion,
  type AdminQuestionDto,
} from "@/lib/admin-api";
import {
  ADMIN_AGE_BANDS,
  ADMIN_DIFFICULTIES,
  ADMIN_EXAM_TYPES,
  ADMIN_QUESTION_STATUSES,
  ADMIN_SUBJECTS,
} from "@/lib/admin-import";
import {
  draftFromQuestion,
  emptyQuestionDraft,
  QuestionEditor,
  type QuestionDraft,
} from "@/components/admin/QuestionEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const selectClass = "h-10 w-full min-w-0 rounded-2xl border border-input bg-background px-3 text-sm font-bold sm:w-auto";

export function QuestionManager() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [ageBand, setAgeBand] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<QuestionDraft | null>(null);

  const filters = useMemo(
    () => ({
      subject_id: subject || undefined,
      exam_type_id: exam || undefined,
      difficulty: difficulty || undefined,
      age_band: ageBand || undefined,
      status: status || undefined,
      q: search.trim() || undefined,
    }),
    [ageBand, difficulty, exam, search, status, subject]
  );

  const list = useQuery({
    queryKey: ["admin-questions", filters],
    queryFn: () => rpcAdminListQuestions(filters),
  });

  const save = useMutation({
    mutationFn: (form: QuestionDraft) =>
      rpcAdminUpsertQuestion({
        id: form.id,
        prompt: form.prompt,
        options: form.options,
        correct_index: form.correct_index,
        explanation: form.explanation,
        subject_id: form.subject_id,
        exam_type_id: form.exam_type_id,
        difficulty: form.difficulty,
        age_band: form.age_band,
        status: form.status,
        topic: form.topic || undefined,
      }),
    onSuccess: () => {
      toast.success("Question saved.");
      setEditorOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    },
  });

  const setStatusMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: AdminQuestionDto["status"] }) =>
      rpcAdminSetQuestionStatus(id, next),
    onSuccess: (row) => {
      toast.success(row.status === "published" ? "Published." : `Set to ${row.status}.`);
      void queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not update status.");
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap">
        <label className="space-y-1 text-xs font-black uppercase tracking-widest">
          Subject
          <select className={selectClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All</option>
            {ADMIN_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-black uppercase tracking-widest">
          Exam
          <select className={selectClass} value={exam} onChange={(e) => setExam(e.target.value)}>
            <option value="">All</option>
            {ADMIN_EXAM_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-black uppercase tracking-widest">
          Difficulty
          <select className={selectClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">All</option>
            {ADMIN_DIFFICULTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-black uppercase tracking-widest">
          Age
          <select className={selectClass} value={ageBand} onChange={(e) => setAgeBand(e.target.value)}>
            <option value="">All</option>
            {ADMIN_AGE_BANDS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-black uppercase tracking-widest">
          Status
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {ADMIN_QUESTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prompt or id"
          className="col-span-2 h-10 rounded-2xl px-3 font-bold sm:max-w-xs"
        />
        <Button
          type="button"
          onClick={() => {
            setDraft(emptyQuestionDraft());
            setEditorOpen(true);
          }}
          className="col-span-2 h-10 rounded-2xl font-black sm:col-span-1"
        >
          New question
        </Button>
      </div>

      {list.error && (
        <p className="font-bold text-destructive">
          {list.error instanceof Error ? list.error.message : "Could not load questions."}
        </p>
      )}

      <div className="glass-card overflow-hidden rounded-3xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-black">Prompt</TableHead>
              <TableHead className="font-black">Subject</TableHead>
              <TableHead className="font-black">Exam</TableHead>
              <TableHead className="font-black">Age</TableHead>
              <TableHead className="font-black">Status</TableHead>
              <TableHead className="font-black">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(list.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-sm truncate font-bold">{row.prompt}</TableCell>
                <TableCell className="font-bold">{row.subject_id}</TableCell>
                <TableCell className="font-bold">{row.exam_type_id}</TableCell>
                <TableCell className="font-bold">{row.age_band}</TableCell>
                <TableCell className="font-black uppercase">{row.status}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-black"
                    onClick={() => {
                      setDraft(draftFromQuestion(row));
                      setEditorOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  {row.status !== "published" ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl font-black"
                      onClick={() => setStatusMut.mutate({ id: row.id, next: "published" })}
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-black"
                      onClick={() => setStatusMut.mutate({ id: row.id, next: "draft" })}
                    >
                      Unpublish
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {list.isLoading && <p className="p-4 font-bold text-muted-foreground">Loading questions…</p>}
        {list.isSuccess && (list.data?.length ?? 0) === 0 && (
          <p className="p-4 font-bold text-muted-foreground">No questions match these filters.</p>
        )}
      </div>

      <QuestionEditor
        open={editorOpen}
        draft={draft}
        busy={save.isPending}
        onOpenChange={setEditorOpen}
        onSave={(form) => save.mutate(form)}
      />
    </div>
  );
}
