import { useState } from "react";
import { toast } from "sonner";
import { rpcErrorMessage, rpcImportQuestions } from "@/lib/admin-api";
import { parseImportText, type ImportError, type ImportQuestionRow } from "@/lib/admin-import";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE = `prompt,option_a,option_b,option_c,option_d,correct_index,explanation,subject,difficulty,age_band,exam_type,topic
What is 9 + 8?,16,17,18,19,1,9 + 8 = 17,math,easy,6-8,casual,addition`;

export function ImportPanel() {
  const [raw, setRaw] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ rows: ImportQuestionRow[]; errors: ImportError[] } | null>(null);
  const [serverErrors, setServerErrors] = useState<ImportError[]>([]);
  const [imported, setImported] = useState<number | null>(null);

  const runParse = () => {
    const parsed = parseImportText(raw);
    setPreview(parsed);
    setServerErrors([]);
    setImported(null);
    if (parsed.errors.length > 0) {
      toast.error(`${parsed.errors.length} row(s) need a fix before import.`);
    } else {
      toast.message(`${parsed.rows.length} valid row(s) ready.`);
    }
  };

  const importRows = async () => {
    const parsed = parseImportText(raw);
    setPreview(parsed);
    if (parsed.errors.length > 0 || parsed.rows.length === 0) {
      toast.error("Fix every invalid row first. Nothing will be written.");
      return;
    }
    setBusy(true);
    try {
      const result = await rpcImportQuestions(parsed.rows);
      setImported(result.imported);
      setServerErrors(result.errors);
      if (result.errors.length > 0) {
        toast.error("Import rejected. No rows were written.");
      } else {
        toast.success(`Imported ${result.imported} question(s) as drafts.`);
      }
    } catch (err) {
      const message = rpcErrorMessage(err, "Import failed.");
      setImported(0);
      setServerErrors([{ row: 0, message }]);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setRaw(await file.text());
    setPreview(null);
    setImported(null);
  };

  return (
    <div className="space-y-4">
      <p className="font-bold text-muted-foreground">
        CSV or JSON. Columns: prompt, option_a–d, correct_index, explanation, subject, difficulty,
        age_band, exam_type, topic. Invalid rows are reported and nothing is committed.
      </p>
      <input
        type="file"
        accept=".csv,.json,text/csv,application/json"
        onChange={(e) => void onFile(e.target.files?.[0])}
        className="block text-sm font-bold"
      />
      <Textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="min-h-56 rounded-3xl font-mono text-xs"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={runParse} className="rounded-2xl font-black">
          Validate
        </Button>
        <Button type="button" disabled={busy} onClick={() => void importRows()} className="rounded-2xl font-black">
          {busy ? "Importing…" : "Import drafts"}
        </Button>
      </div>
      {imported !== null && (
        <p className="font-black">
          {serverErrors.length > 0 ? "0 imported (rolled back)." : `${imported} imported.`}
        </p>
      )}
      {(preview?.errors.length || serverErrors.length) ? (
        <ul className="space-y-1 rounded-3xl bg-destructive/10 p-4 text-sm font-bold text-destructive">
          {[...(preview?.errors ?? []), ...serverErrors].map((err) => (
            <li key={`${err.row}-${err.message}`}>
              Row {err.row}: {err.message}
            </li>
          ))}
        </ul>
      ) : null}
      {preview && preview.errors.length === 0 && (
        <p className="text-sm font-bold text-muted-foreground">{preview.rows.length} valid rows.</p>
      )}
    </div>
  );
}
