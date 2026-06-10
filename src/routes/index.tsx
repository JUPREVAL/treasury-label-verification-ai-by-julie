import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, FileImage, Trash2, ShieldCheck } from 'lucide-react';
import { ocrImage } from '@/lib/ocr';
import {
  verifyLabel,
  GOVERNMENT_WARNING_TEXT,
  type ApplicationData,
  type FieldResult,
} from '@/lib/label-verify';

export const Route = createFileRoute('/')({
  component: VerifyPage,
});

interface LabelItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  rawText?: string;
  results?: FieldResult[];
  elapsedMs?: number;
  error?: string;
}

function VerifyPage() {
  const [items, setItems] = useState<LabelItem[]>([]);
  const [app, setApp] = useState<ApplicationData>({
    brandName: '',
    classType: '',
    abv: '',
    netContents: '',
    bottler: '',
  });
  const [running, setRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming: LabelItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: 'pending' as const,
      }));
    if (incoming.length === 0) {
      toast.error('Please upload image files only (JPG, PNG).');
      return;
    }
    setItems((prev) => [...prev, ...incoming]);
  }, []);

  const removeItem = (id: string) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
  };

  const runVerification = async () => {
    if (items.length === 0) {
      toast.error('Please upload at least one label image.');
      return;
    }
    setRunning(true);
    // Process sequentially to keep the worker steady on low-end devices.
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'processing' } : p)));
      const started = performance.now();
      try {
        const text = await ocrImage(item.file);
        const results = verifyLabel(text, app);
        const elapsed = Math.round(performance.now() - started);
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: 'done', rawText: text, results, elapsedMs: elapsed } : p,
          ),
        );
      } catch (e) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: 'error', error: e instanceof Error ? e.message : 'OCR failed' }
              : p,
          ),
        );
      }
    }
    setRunning(false);
    toast.success('Verification complete.');
  };

  const overall = useMemo(() => {
    const all = items.flatMap((i) => i.results ?? []);
    return summarize(all);
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">TTB Label Verification</h1>
            <p className="text-xs text-slate-500">
              AI-powered proof-of-concept for alcohol beverage label review
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-12">
        {/* LEFT: Inputs */}
        <section className="space-y-6 lg:col-span-5">
          <Card className="p-5">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Step 1 — Upload labels</h2>
            <p className="mb-4 text-sm text-slate-600">
              Add one or many label images. JPG or PNG.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-slate-600 transition-colors hover:border-blue-500 hover:bg-blue-50"
            >
              <Upload className="h-8 w-8" />
              <span className="text-base font-medium">Click to upload images</span>
              <span className="text-xs text-slate-500">Single or batch (multiple files)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = '';
              }}
            />

            {items.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {items.length} label{items.length === 1 ? '' : 's'} queued
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {items.map((it) => (
                    <div key={it.id} className="group relative overflow-hidden rounded-md border bg-white">
                      <img
                        src={it.previewUrl}
                        alt={it.file.name}
                        className="h-24 w-full object-cover"
                      />
                      <button
                        onClick={() => removeItem(it.id)}
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-700 opacity-0 shadow group-hover:opacity-100"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {it.status !== 'pending' && (
                        <div className="absolute bottom-1 left-1">
                          <StatusBadge status={it.status} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Step 2 — Expected application data</h2>
            <p className="mb-4 text-sm text-slate-600">Enter what should be printed on the label.</p>

            <div className="space-y-3">
              <Field label="Brand Name" placeholder="e.g. Eagle Crest Bourbon" value={app.brandName} onChange={(v) => setApp({ ...app, brandName: v })} />
              <Field label="Class / Type" placeholder="e.g. Straight Bourbon Whiskey" value={app.classType} onChange={(v) => setApp({ ...app, classType: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="ABV" placeholder="e.g. 40%" value={app.abv} onChange={(v) => setApp({ ...app, abv: v })} />
                <Field label="Net Contents" placeholder="e.g. 750 mL" value={app.netContents} onChange={(v) => setApp({ ...app, netContents: v })} />
              </div>
              <Field label="Bottler / Producer" placeholder="e.g. Eagle Crest Distilling Co., Frankfort, KY" value={app.bottler} onChange={(v) => setApp({ ...app, bottler: v })} />
            </div>
          </Card>

          <Button
            onClick={runVerification}
            disabled={running || items.length === 0}
            className="h-14 w-full bg-blue-900 text-base font-semibold text-white hover:bg-blue-800"
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying labels…
              </>
            ) : (
              <>Run Verification</>
            )}
          </Button>
        </section>

        {/* RIGHT: Results */}
        <section className="lg:col-span-7">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Results</h2>
              {items.some((i) => i.status === 'done') && (
                <div className="flex gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {overall.match} match
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> {overall.uncertain} uncertain
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    <XCircle className="mr-1 h-3.5 w-3.5" /> {overall.mismatch} mismatch
                  </Badge>
                </div>
              )}
            </div>

            {items.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 p-12 text-center text-slate-500">
                <FileImage className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                Upload labels and click <strong>Run Verification</strong> to see results.
              </div>
            )}

            <div className="space-y-4">
              {items.map((item) => (
                <LabelResult key={item.id} item={item} />
              ))}
            </div>
          </Card>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-slate-500">
        Proof of concept — not connected to COLA. OCR runs locally in your browser.
      </footer>
    </div>
  );
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1 block text-sm font-medium text-slate-700">{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-11 text-base" />
    </div>
  );
}

function StatusBadge({ status }: { status: LabelItem['status'] }) {
  if (status === 'processing')
    return (
      <span className="inline-flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Reading
      </span>
    );
  if (status === 'done')
    return <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Done</span>;
  if (status === 'error')
    return <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Error</span>;
  return null;
}

function LabelResult({ item }: { item: LabelItem }) {
  const summary = item.results ? summarize(item.results) : null;
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex gap-4">
        <img src={item.previewUrl} alt={item.file.name} className="h-24 w-24 flex-shrink-0 rounded-md border object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{item.file.name}</p>
              {item.elapsedMs != null && (
                <p className="text-xs text-slate-500">
                  Processed in {(item.elapsedMs / 1000).toFixed(1)}s
                </p>
              )}
            </div>
            {summary && (
              <div className="flex flex-shrink-0 gap-1">
                {summary.match > 0 && <PillCount value={summary.match} status="match" />}
                {summary.uncertain > 0 && <PillCount value={summary.uncertain} status="uncertain" />}
                {summary.mismatch > 0 && <PillCount value={summary.mismatch} status="mismatch" />}
              </div>
            )}
          </div>
          {item.status === 'processing' && (
            <p className="mt-2 text-sm text-blue-700">Reading label text…</p>
          )}
          {item.status === 'error' && (
            <p className="mt-2 text-sm text-red-700">Error: {item.error}</p>
          )}
        </div>
      </div>

      {item.results && (
        <div className="mt-4 overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Field</th>
                <th className="px-3 py-2 font-medium">Expected</th>
                <th className="px-3 py-2 font-medium">Found on label</th>
                <th className="px-3 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {item.results.map((r) => (
                <tr key={r.field} className="align-top">
                  <td className="px-3 py-2 font-medium text-slate-700">{r.field}</td>
                  <td className="px-3 py-2 text-slate-600">
                    <ExpandableText text={r.expected} />
                  </td>
                  <td className="px-3 py-2 text-slate-900">
                    <ExpandableText text={r.extracted || '—'} />
                  </td>
                  <td className="px-3 py-2"><ResultPill status={r.status} note={r.note} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {item.rawText && (
        <details className="mt-3 text-xs text-slate-600">
          <summary className="cursor-pointer select-none font-medium text-slate-700">View full extracted text</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3 font-mono">{item.rawText}</pre>
        </details>
      )}
    </div>
  );
}

function ExpandableText({ text }: { text: string }) {
  const isWarning = text === GOVERNMENT_WARNING_TEXT;
  if (text.length <= 80 && !isWarning) return <span>{text}</span>;
  return (
    <details>
      <summary className="cursor-pointer select-none text-slate-600">
        {text.slice(0, 70)}…
      </summary>
      <p className="mt-1 whitespace-pre-wrap text-slate-600">{text}</p>
    </details>
  );
}

function ResultPill({ status, note }: { status: FieldResult['status']; note?: string }) {
  const map = {
    match: { cls: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Match' },
    mismatch: { cls: 'bg-red-100 text-red-800', icon: <XCircle className="h-3.5 w-3.5" />, label: 'Mismatch' },
    uncertain: { cls: 'bg-amber-100 text-amber-800', icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Uncertain' },
  } as const;
  const m = map[status];
  return (
    <div className="space-y-1">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>
        {m.icon} {m.label}
      </span>
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function PillCount({ value, status }: { value: number; status: FieldResult['status'] }) {
  const cls =
    status === 'match'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'mismatch'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-800';
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>{value}</span>;
}

function summarize(results: FieldResult[]) {
  return {
    match: results.filter((r) => r.status === 'match').length,
    mismatch: results.filter((r) => r.status === 'mismatch').length,
    uncertain: results.filter((r) => r.status === 'uncertain').length,
  };
}
