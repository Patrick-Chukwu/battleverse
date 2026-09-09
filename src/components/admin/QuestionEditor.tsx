import { useEffect, useState } from "react";
import type { AdminQuestionDto } from "@/lib/admin-api";
import {
  ADMIN_AGE_BANDS,
  ADMIN_DIFFICULTIES,
  ADMIN_EXAM_TYPES,
  ADMIN_QUESTION_STATUSES,
  ADMIN_SUBJECTS,
  generateQuestionId,
} from "@/lib/admin-import";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SUBJECTS = ADMIN_SUBJECTS;
const selectClass =
  "h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm font-bold";

export interface QuestionDraft {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
  subject_id: string;
  exam_type_id: string;
  difficulty: string;
  age_band: string;
  status: string;
  topic: string;
}

export function emptyQuestionDraft(): QuestionDraft {
  return {
    id: generateQuestionId("new"),
    prompt: "",
    options: ["", "", "", ""],
    correct_index: 0,
    explanation: "",
    subject_id: "math",
    exam_type_id: "casual",
    difficulty: "easy",
    age_band: "9-12",
    status: "draft",
    topic: "",
  };
}

export function draftFromQuestion(row: AdminQuestionDto): QuestionDraft {
  const opts = row.options ?? ["", "", "", ""];
  return {
    id: row.id,
    prompt: row.prompt,
    options: [opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? ""],
    correct_index: row.correct_index,
    explanation: row.explanation,
    subject_id: row.subject_id,
    exam_type_id: row.exam_type_id,
    difficulty: row.difficulty,
    age_band: row.age_band,
    status: row.status,
    topic: "",
  };
}

interface QuestionEditorProps {
  open: boolean;
  draft: QuestionDraft | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: QuestionDraft) => void;
}

export function QuestionEditor({ open, draft, busy, onOpenChange, onSave }: QuestionEditorProps) {
  const [form, setForm] = useState<QuestionDraft>(draft ?? emptyQuestionDraft());

  useEffect(() => {
    if (open && draft) setForm(draft);
  }, [draft, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Question</DialogTitle>
          <DialogDescription className="font-bold">
            Publish to send this item to Practice on the next player sync.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-black">Prompt</Label>
            <Textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              className="min-h-24 rounded-2xl px-4 font-bold"
            />
          </div>
          {form.options.map((opt, i) => (
            <div key={i} className="space-y-2">
              <Label className="font-black">
                Option {String.fromCharCode(65 + i)}
                {form.correct_index === i ? " · correct" : ""}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...form.options] as QuestionDraft["options"];
                    next[i] = e.target.value;
                    setForm({ ...form, options: next });
                  }}
                  className="h-11 rounded-2xl px-4 font-bold"
                />
                <Button
                  type="button"
                  variant={form.correct_index === i ? "default" : "outline"}
                  onClick={() => setForm({ ...form, correct_index: i })}
                  className="rounded-2xl"
                >
                  Correct
                </Button>
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Label className="font-black">Explanation</Label>
            <Textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="rounded-2xl px-4 font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-black uppercase tracking-widest">
              Subject
              <select
                className={selectClass}
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-black uppercase tracking-widest">
              Exam
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
            <label className="space-y-1 text-xs font-black uppercase tracking-widest">
              Difficulty
              <select
                className={selectClass}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                {ADMIN_DIFFICULTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-black uppercase tracking-widest">
              Age band
              <select
                className={selectClass}
                value={form.age_band}
                onChange={(e) => setForm({ ...form, age_band: e.target.value })}
              >
                {ADMIN_AGE_BANDS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-black uppercase tracking-widest">
              Status
              <select
                className={selectClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {ADMIN_QUESTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-black uppercase tracking-widest">
              Topic (optional)
              <Input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="h-11 rounded-2xl px-3 font-bold"
              />
            </label>
          </div>
        </div>
        <DialogFooter className="border-0 bg-transparent p-0 sm:justify-stretch">
          <Button
            type="button"
            disabled={busy}
            onClick={() => onSave(form)}
            className="h-12 w-full rounded-2xl text-base font-black"
          >
            {busy ? "Saving…" : "Save question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
