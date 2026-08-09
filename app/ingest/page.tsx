'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioRecorder, toDatetimeLocal } from '@/components/audio-recorder';
import { Card, Pill } from '@/components/ui';
import PageHeader from '@/components/page-header';
import type { Job, JobPhase } from '@/lib/api';
import { uploadRecordingFile } from '@/lib/upload-recording';

/**
 * CAPTURE.
 *
 * Three ways in, all of which hand Big Ears a reference rather than bytes:
 *
 *   · Upload — presigned PUT to Supabase or S3, then hand Big Ears the URI
 *   · Record — browser mic via MediaRecorder, then same presign → ingest flow
 *   · Paste URI — supabase:// or s3:// if the object is already in a bucket
 *   · Paste transcript — DiarizedTranscript, for exercising the pipeline with no audio
 *
 * Submit returns a job id immediately; this page polls for progress.
 */

type Tab = 'audio' | 'transcript';

const PHASES: { key: JobPhase; label: string }[] = [
  { key: 'download', label: 'Locate audio' },
  { key: 'stt', label: 'Transcribe' },
  { key: 'persist', label: 'Save transcript' },
  { key: 'reconcile', label: 'Reconcile visit' },
  { key: 'analysis', label: 'Run agents' },
  { key: 'scoring', label: 'Score' },
];

const POLL_MS = 2000;

const SAMPLE_TRANSCRIPT = `{
  "transcriptId": "t-demo-001",
  "storeId": "giva-blr-indiranagar",
  "storeName": "GIVA Indiranagar, Bengaluru",
  "staffId": "staff_rahul_verma",
  "staffName": "Rahul Verma",
  "startedAt": "2026-08-08T11:15:00.000Z",
  "durationSec": 320,
  "language": "hi-en",
  "source": "manual",
  "utterances": [
    { "startMs": 1500,  "speaker": "A", "text": "Namaste, welcome to GIVA Indiranagar. Aaiye please, baithiye." },
    { "startMs": 8000,  "speaker": "B", "text": "Ji, mangalsutra dekhna tha. Meri shaadi next month hai." },
    { "startMs": 16000, "speaker": "A", "text": "Congratulations! Pehle paani ya chai — kya lenge aap?" },
    { "startMs": 24000, "speaker": "B", "text": "Paani, thank you." },
    { "startMs": 30000, "speaker": "A", "text": "Budget roughly kitna soch rahe hain, taaki main sahi range dikhaoon?" },
    { "startMs": 38000, "speaker": "B", "text": "70 se 90 thousand ke around." },
    { "startMs": 46000, "speaker": "A", "text": "Ye dekhiye — 22K gold, 78,000, making charges 12 percent alag se." },
    { "startMs": 58000, "speaker": "B", "text": "Thoda sochna padega. Kal wapas aa sakte hain?" },
    { "startMs": 64000, "speaker": "A", "text": "Bilkul. Main ye piece 24 hours hold kar deti hoon aapke naam pe." }
  ]
}`;

export default function Ingest() {
  const [tab, setTab] = useState<Tab>('audio');
  const [job, setJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const running = job !== null && (job.status === 'queued' || job.status === 'running');

  useEffect(() => {
    if (!job || !running) return;
    const id = job.jobId;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: 'no-store' });
        if (!res.ok) return;
        setJob(await res.json());
      } catch {
        // A dropped poll is not a failed job — the next tick retries.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [job, running]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [job?.log.length]);

  const submit = useCallback(async (body: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    setJob(null);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setJob({
        jobId: data.jobId, kind: 'audio', status: 'queued', phase: 'queued',
        storeId: '', staffId: '', s3Uri: null,
        createdAt: new Date().toISOString(), startedAt: null, finishedAt: null,
        result: null, error: null, log: [],
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, []);

  return (
    <>
      <PageHeader
        title="Ingest recording"
        sub="Upload a file, record live from your mic, or paste a storage URI. Audio goes straight to storage; analysis runs in the background."
      />

      <div className="flex gap-1.5 mb-3.5">
        {([['audio', 'Recording'], ['transcript', 'Paste a Diarized Transcript']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-[7px] text-[12.5px] border ${
              tab === key ? 'bg-ink text-white border-ink font-semibold' : 'bg-white border-stone-200 hover:bg-stone-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3.5 items-start">
        {tab === 'audio' ? <AudioForm onSubmit={submit} busy={submitting || running} /> : <TranscriptForm onSubmit={submit} busy={submitting || running} />}
        <JobPanel job={job} error={error} logRef={logRef} />
      </div>
    </>
  );
}

/* ── Audio form ───────────────────────────────────────────────────────── */

type AudioMode = 'upload' | 'record';

function AudioForm({ onSubmit, busy }: { onSubmit: (b: Record<string, unknown>) => void; busy: boolean }) {
  const [mode, setMode] = useState<AudioMode>('record');
  const [f, setF] = useState({
    s3Uri: '',
    storeId: '',
    storeName: '',
    staffId: '',
    staffName: '',
    staffEmail: '',
    startedAt: '',
    language: 'hi-en',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const metadataReady = f.storeId.trim() && f.staffId.trim() && f.staffName.trim();
  const uriReady = Boolean(f.s3Uri.trim());
  const ready = metadataReady && (uriReady || Boolean(file));

  const handleRecordingReady = useCallback((result: { file: File; startedAt: Date }) => {
    setFile(result.file);
    setF((prev) => ({ ...prev, s3Uri: '', startedAt: toDatetimeLocal(result.startedAt) }));
    setUploadError(null);
  }, []);

  const clearRecording = useCallback(() => {
    setFile(null);
    setF((prev) => ({ ...prev, s3Uri: '' }));
  }, []);

  const uploadAndSubmit = async () => {
    if (!metadataReady) return;
    setUploadError(null);

    let uri = f.s3Uri.trim();

    if (!uri && file) {
      setUploading(true);
      try {
        uri = await uploadRecordingFile(file);
        setF((prev) => ({ ...prev, s3Uri: uri }));
      } catch (e) {
        setUploadError((e as Error).message);
        return;
      } finally {
        setUploading(false);
      }
    }

    if (!uri) {
      setUploadError(mode === 'record' ? 'Record audio or fill metadata first.' : 'Choose a file to upload or paste a storage URI.');
      return;
    }

    onSubmit({
      s3Uri: uri,
      storeId: f.storeId.trim(),
      storeName: f.storeName.trim() || undefined,
      staffId: f.staffId.trim(),
      staffName: f.staffName.trim(),
      staffEmail: f.staffEmail.trim() || undefined,
      startedAt: f.startedAt ? new Date(f.startedAt).toISOString() : undefined,
      language: f.language.trim() || 'hi-en',
    });
  };

  const working = busy || uploading;

  return (
    <Card title="Recording" note="presigned upload to Supabase or S3">
      <div className="grid gap-2.5">
        <div className="flex gap-1.5">
          {([
            ['record', 'Record live'],
            ['upload', 'Upload file'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key);
                setUploadError(null);
                setFile(null);
                setF((prev) => ({ ...prev, s3Uri: '' }));
              }}
              className={`px-2.5 py-1 rounded-[6px] text-[11.5px] border ${
                mode === key
                  ? 'bg-stone-800 text-white border-stone-800 font-semibold'
                  : 'bg-white border-stone-200 text-muted hover:bg-stone-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'record' ? (
          <AudioRecorder
            onRecordingReady={handleRecordingReady}
            onClear={clearRecording}
            disabled={working}
          />
        ) : (
          <>
            <Field label="Audio file" hint="presigned upload on submit — bytes go straight to storage">
              <input
                type="file"
                accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg"
                className={`${inputCls} file:mr-2 file:text-[12px] file:border-0 file:bg-stone-100 file:px-2 file:py-1 file:rounded`}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setUploadError(null);
                }}
              />
              {file && (
                <div className="text-[11px] text-muted mt-1">
                  {file.name} · {(file.size / 1_048_576).toFixed(1)} MB
                </div>
              )}
            </Field>

            <Field label="Storage URI" hint="optional if uploading — supabase:// or s3://">
              <input
                className={inputCls}
                value={f.s3Uri}
                onChange={set('s3Uri')}
                placeholder="supabase://bigears-recordings/2026-08-08/recording.m4a"
                spellCheck={false}
              />
            </Field>
          </>
        )}

        {mode === 'record' && file && (
          <div className="text-[11px] text-muted -mt-1">
            Recording attached — fill store & staff below, then analyse.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Store id"><input className={inputCls} value={f.storeId} onChange={set('storeId')} placeholder="giva-blr-indiranagar" /></Field>
          <Field label="Store name" hint="optional"><input className={inputCls} value={f.storeName} onChange={set('storeName')} /></Field>
          <Field label="Staff id"><input className={inputCls} value={f.staffId} onChange={set('staffId')} placeholder="staff_rahul_verma" /></Field>
          <Field label="Staff name"><input className={inputCls} value={f.staffName} onChange={set('staffName')} /></Field>
          <Field label="Staff email" hint="optional"><input className={inputCls} value={f.staffEmail} onChange={set('staffEmail')} /></Field>
          <Field label="Language"><input className={inputCls} value={f.language} onChange={set('language')} /></Field>
        </div>

        <Field
          label="Captured at"
          hint="when the conversation happened, not when you uploaded — visits are grouped on a ±2h window"
        >
          <input type="datetime-local" className={inputCls} value={f.startedAt} onChange={set('startedAt')} />
        </Field>

        {uploadError && <div className="text-[12px] text-bad">{uploadError}</div>}

        <button
          disabled={!ready || working}
          onClick={uploadAndSubmit}
          className="mt-1 px-3.5 py-2 rounded-[7px] bg-ink text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {working ? (uploading ? 'Uploading…' : 'Analysing…') : 'Analyse recording'}
        </button>
      </div>
    </Card>
  );
}

/* ── Transcript form ──────────────────────────────────────────────────── */

function transcriptFromPaste(raw: unknown): unknown {
  let cur = raw;
  for (let i = 0; i < 3; i++) {
    if (!cur || typeof cur !== 'object') break;
    if ('storeId' in cur && 'utterances' in cur) break;
    if ('transcript' in cur) {
      cur = (cur as { transcript: unknown }).transcript;
      continue;
    }
    break;
  }
  return cur;
}

function TranscriptForm({ onSubmit, busy }: { onSubmit: (b: Record<string, unknown>) => void; busy: boolean }) {
  const [text, setText] = useState(SAMPLE_TRANSCRIPT);
  const [parseError, setParseError] = useState<string | null>(null);

  const go = () => {
    try {
      setParseError(null);
      onSubmit({ transcript: transcriptFromPaste(JSON.parse(text)) });
    } catch (e) {
      setParseError(`Not valid JSON — ${(e as Error).message}`);
    }
  };

  return (
    <Card title="Paste a Diarized Transcript" note="no audio required">
      <p className="text-xs text-muted leading-relaxed mb-2.5">
        Paste the transcript object (fields like <code className="bg-stone-100 px-1 rounded">storeId</code>,{' '}
        <code className="bg-stone-100 px-1 rounded">utterances</code>) — or the full{' '}
        <code className="bg-stone-100 px-1 rounded">{'{ "transcript": { … } }'}</code> body from curl.
        Either shape works.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="w-full h-[340px] font-mono text-[11.5px] leading-relaxed p-2.5 rounded-[7px] border border-stone-200 bg-stone-50"
      />
      {parseError && <div className="text-[12px] text-bad mt-2">{parseError}</div>}
      <button
        disabled={busy}
        onClick={go}
        className="mt-2.5 px-3.5 py-2 rounded-[7px] bg-ink text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? 'Analysing…' : 'Analyse transcript'}
      </button>
    </Card>
  );
}

/* ── Job panel ────────────────────────────────────────────────────────── */

function JobPanel({
  job,
  error,
  logRef,
}: {
  job: Job | null;
  error: string | null;
  logRef: React.RefObject<HTMLDivElement>;
}) {
  if (error) {
    return (
      <Card title="Failed">
        <div className="text-[13px] text-bad leading-relaxed">{error}</div>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card title="Progress">
        <div className="text-[13px] text-muted py-8 text-center leading-relaxed">
          Nothing running.
          <div className="text-xs mt-1.5">Submit a recording and the pipeline log appears here.</div>
        </div>
      </Card>
    );
  }

  const reached = PHASES.findIndex((p) => p.key === job.phase);
  const done = job.status === 'succeeded';
  const failed = job.status === 'failed';

  return (
    <Card
      title="Progress"
      note={
        <span className="font-mono text-[11px]">
          {job.jobId} ·{' '}
          <Pill tone={done ? 'good' : failed ? 'bad' : 'info'}>{job.status}</Pill>
        </span>
      }
    >
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PHASES.map((p, i) => {
          const state = done || i < reached ? 'done' : i === reached ? 'active' : 'todo';
          return (
            <span
              key={p.key}
              className={`px-2 py-1 rounded-[6px] text-[11px] border ${
                state === 'done'
                  ? 'bg-good-soft border-good text-good'
                  : state === 'active'
                    ? 'bg-accent-soft border-accent-line text-accent font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
              }`}
            >
              {state === 'done' ? '✓ ' : state === 'active' ? '◐ ' : ''}
              {p.label}
            </span>
          );
        })}
      </div>

      <div
        ref={logRef}
        className="h-[280px] overflow-y-auto rounded-[7px] bg-ink text-stone-300 font-mono text-[11px] leading-relaxed p-2.5"
      >
        {job.log.length === 0 && <div className="text-stone-500">Waiting for the worker to pick this up…</div>}
        {job.log.map((l, i) => (
          <div key={i} className={l.message.startsWith('ERROR') ? 'text-red-400' : undefined}>
            <span className="text-stone-600">{l.at.slice(11, 19)} </span>
            {l.message}
          </div>
        ))}
      </div>

      {failed && <div className="mt-2.5 text-[12.5px] text-bad leading-relaxed">{job.error}</div>}

      {done && job.result && (
        <div className="mt-2.5 text-[12.5px] leading-relaxed">
          <div className="font-semibold mb-1">
            {job.result.visits.length} visit{job.result.visits.length === 1 ? '' : 's'} analysed
          </div>
          {job.result.visits.map((v) => (
            <div key={v.visitId} className="flex items-center gap-2 py-0.5">
              <Link href={`/visits/${v.visitId}`} className="text-info underline font-mono text-[11.5px]">
                {v.visitId}
              </Link>
              <span className="text-muted">score {v.overallScore ?? '—'}</span>
              {v.isNew && <Pill tone="good">new</Pill>}
            </div>
          ))}
          <div className="text-xs text-muted mt-1.5">{job.result.reconciliationSummary}</div>
        </div>
      )}
    </Card>
  );
}

const inputCls =
  'w-full px-2.5 py-1.5 rounded-[7px] border border-stone-200 text-[12.5px] bg-white focus:outline-none focus:border-stone-400';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-muted block mb-1">
        {label}
        {hint && <span className="normal-case tracking-normal text-stone-400 ml-1.5">— {hint}</span>}
      </span>
      {children}
    </label>
  );
}
