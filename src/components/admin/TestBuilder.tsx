import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rpcAdminListQuestions, rpcAdminListTests, rpcAdminUpsertTest, type AdminTestDto } from "@/lib/admin-api";
import { ADMIN_EXAM_TYPES, ADMIN_SUBJECTS, ADMIN_TEST_STATUSES } from "@/lib/admin-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const selectClass = "h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm font-bold";

const emptyForm = {
  id: "",
  title: "",
  exam_type_id: "custom",
  subject_ids: [] as string[],
  question_count: 8,
  time_limit_s: 600,
  pass_mark_pct: 50,
  hints_allowed: false,
  offline_pack: false,
  status: "draft",
  question_ids: [] as string[],
};

export function TestBuilder() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const tests = useQuery({ queryKey: ["admin-tests"], queryFn: rpcAdminListTests });
  const questions = useQuery({ queryKey: ["admin-questions", {}], queryFn: () => rpcAdminListQuestions({}) });

  const picker = useMemo(() => questions.data ?? [], [questions.data]);

  const save = useMutation({
    mutationFn: () =>
      rpcAdminUpsertTest({
        id: form.id || undefined,
        title: form.title,
        exam_type_id: form.exam_type_id,
        subject_ids: form.subject_ids,
        question_count: form.question_count,
        time_limit_s: form.time_limit_s,
        pass_mark_pct: form.pass_mark_pct,
        hints_allowed: form.hints_allowed,
        offline_pack: form.offline_pack,
        status: form.status,
        question_ids: form.question_ids,
      }),
    onSuccess: () => {
      toast.success("Test saved.");
      setForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: ["admin-tests"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not save test.");
    },
  });

  const load = (row: AdminTestDto) => {
    setForm({
      id: row.id,
      title: row.title,
      exam_type_id: row.exam_type_id,
      subject_ids: row.subject_ids ?? [],
      question_count: row.question_count,
      time_limit_s: row.time_limit_s ?? 600,
      pass_mark_pct: row.pass_mark_pct ?? 50,
      hints_allowed: row.hints_allowed,
      offline_pack: row.offline_pack,
      status: row.status,
      question_ids: row.question_ids ?? [],
    });
  };

  const toggleSubject = (id: string) => {
    setForm((prev) => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(id)
        ? prev.subject_ids.filter((s) => s !== id)
        : [...prev.subject_ids, id],
    }));
  };

  const toggleQuestion = (id: string) => {
    setForm((prev) => ({
      ...prev,
      question_ids: prev.question_ids.includes(id)
        ? prev.question_ids.filter((q) => q !== id)
        : [...prev.question_ids, id],
    }));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Custom test</h2>
          <Button type="button" variant="outline" className="rounded-2xl font-black" onClick={() => setForm(emptyForm)}>
            New
          </Button>
        </div>
        <div className="space-y-2">
          <Label className="font-black">Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-11 rounded-2xl px-4 font-bold"
          />
        </div>
        <label className="space-y-1 text-xs font-black uppercase tracking-widest">
          Exam type
          <select
            className={selectClass}
            value={form.exam_type_id}
            onChange={(e) => setForm({ ...form, exam_type_id: e.target.value })}
          >
            {ADMIN_EXAM_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-widest">Subjects</p>
          <div className="flex flex-wrap gap-2">
            {ADMIN_SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSubject(s)}
                className={`rounded-xl px-3 py-1.5 text-sm font-black ${
                  form.subject_ids.includes(s) ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-black uppercase tracking-widest">
            Question count
            <Input
              type="number"
              value={form.question_count}
              onChange={(e) => setForm({ ...form, question_count: Number(e.target.value) })}
              className="h-11 rounded-2xl px-3 font-bold"
            />
          </label>
          <label className="space-y-1 text-xs font-black uppercase tracking-widest">
            Time limit (s)
            <Input
              type="number"
              value={form.time_limit_s}
              onChange={(e) => setForm({ ...form, time_limit_s: Number(e.target.value) })}
              className="h-11 rounded-2xl px-3 font-bold"
            />
          </label>
          <label className="space-y-1 text-xs font-black uppercase tracking-widest">
            Pass mark %
            <Input
              type="number"
              value={form.pass_mark_pct}
              onChange={(e) => setForm({ ...form, pass_mark_pct: Number(e.target.value) })}
              className="h-11 rounded-2xl px-3 font-bold"
            />
          </label>
          <label className="space-y-1 text-xs font-black uppercase tracking-widest">
            Status
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {ADMIN_TEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.hints_allowed}
            onChange={(e) => setForm({ ...form, hints_allowed: e.target.checked })}
            className="size-4 accent-primary"
          />
          Hints allowed
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.offline_pack}
            onChange={(e) => setForm({ ...form, offline_pack: e.target.checked })}
            className="size-4 accent-primary"
          />
          Offline pack
        </label>
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-widest">
            Questions ({form.question_ids.length} selected)
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-3xl border border-border/60 p-3">
            {picker.map((q) => (
              <label key={q.id} className="flex items-start gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.question_ids.includes(q.id)}
                  onChange={() => toggleQuestion(q.id)}
                  className="mt-1 size-4 accent-primary"
                />
                <span>
                  <span className="text-muted-foreground">{q.subject_id}</span> · {q.prompt}
                </span>
              </label>
            ))}
          </div>
        </div>
        <Button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="h-12 w-full rounded-2xl font-black"
        >
          {save.isPending ? "Saving…" : form.id ? "Update test" : "Create test"}
        </Button>
      </div>

      <div className="glass-card overflow-hidden rounded-3xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-black">Title</TableHead>
              <TableHead className="font-black">Exam</TableHead>
              <TableHead className="font-black">Items</TableHead>
              <TableHead className="font-black">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tests.data ?? []).map((row) => (
              <TableRow key={row.id} className="cursor-pointer" onClick={() => load(row)}>
                <TableCell className="font-bold">{row.title}</TableCell>
                <TableCell className="font-bold">{row.exam_type_id}</TableCell>
                <TableCell className="font-bold">{row.question_ids?.length ?? 0}</TableCell>
                <TableCell className="font-black uppercase">{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tests.isSuccess && (tests.data?.length ?? 0) === 0 && (
          <p className="p-4 font-bold text-muted-foreground">No custom tests yet. Create one on the left.</p>
        )}
      </div>
    </div>
  );
}
