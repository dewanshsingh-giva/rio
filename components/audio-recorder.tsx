'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface RecordingResult {
  file: File;
  startedAt: Date;
  durationSec: number;
}

type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const;

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const type of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function extensionForMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export { toDatetimeLocal };

export function AudioRecorder({
  onRecordingReady,
  onClear,
  disabled,
}: {
  onRecordingReady: (result: RecordingResult) => void;
  onClear?: () => void;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RecordingResult | null>(null);
  const [micDenied, setMicDenied] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef('');

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    stopTracks();
    setStatus('idle');
    setElapsedSec(0);
    setPreview(null);
    setError(null);
    onClear?.();
  }, [clearTimer, onClear, stopTracks]);

  const previewUrl = useMemo(
    () => (preview ? URL.createObjectURL(preview.file) : null),
    [preview],
  );

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => () => {
    clearTimer();
    if (recorderRef.current?.state !== 'inactive') {
      try {
        recorderRef.current?.stop();
      } catch {
        // already stopped
      }
    }
    stopTracks();
  }, [clearTimer, stopTracks]);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      const start = startedAtRef.current;
      if (!start) return;
      setElapsedSec(Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000)));
    }, 250);
  }, [clearTimer]);

  const finalizeRecording = useCallback(() => {
    const mime = mimeRef.current || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mime });
    const startedAt = startedAtRef.current ?? new Date();
    const durationSec = Math.max(1, Math.floor((Date.now() - startedAt.getTime()) / 1000));
    const ext = extensionForMime(mime);
    const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
    const file = new File([blob], `recording-${stamp}.${ext}`, { type: mime });
    const result: RecordingResult = { file, startedAt, durationSec };
    setElapsedSec(durationSec);
    setPreview(result);
    setStatus('stopped');
    onRecordingReady(result);
  }, [onRecordingReady]);

  const start = async () => {
    if (disabled) return;
    setError(null);
    setMicDenied(false);
    setPreview(null);
    onClear?.();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      mimeRef.current = mime;
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = new Date();
      setElapsedSec(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        clearTimer();
        stopTracks();
        if (chunksRef.current.length > 0) finalizeRecording();
      };
      recorder.onerror = () => {
        setError('Recording failed — try again.');
        reset();
      };

      recorder.start(1000);
      setStatus('recording');
      startTimer();
    } catch (e) {
      stopTracks();
      const msg = (e as Error).message ?? 'Could not access microphone.';
      if (msg.toLowerCase().includes('permission') || (e as DOMException).name === 'NotAllowedError') {
        setMicDenied(true);
        setError('Microphone access denied. Allow mic permission and try again.');
      } else {
        setError(msg);
      }
    }
  };

  const pause = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== 'recording') return;
    rec.pause();
    clearTimer();
    setStatus('paused');
  };

  const resume = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== 'paused') return;
    rec.resume();
    startTimer();
    setStatus('recording');
  };

  const stop = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    rec.stop();
  };

  const busy = disabled || status === 'recording' || status === 'paused';

  return (
    <div className="rounded-[10px] border border-stone-200 bg-stone-50/80 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-[12px] font-semibold text-ink">Live recording</div>
          <div className="text-[11px] text-muted mt-0.5">
            Uses your device mic · saved as a file when you stop
          </div>
        </div>
        <div
          className={`font-mono text-xl tabular-nums font-semibold ${
            status === 'recording' ? 'text-bad' : 'text-ink'
          }`}
          aria-live="polite"
        >
          {status === 'idle' && !preview ? '0:00' : formatTimer(preview?.durationSec ?? elapsedSec)}
        </div>
      </div>

      {status === 'recording' && (
        <div className="flex items-center gap-2 mb-3 text-[11px] text-bad font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bad opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-bad" />
          </span>
          Recording…
        </div>
      )}

      {status === 'paused' && (
        <div className="mb-3 text-[11px] text-warn font-medium">Paused</div>
      )}

      {preview && status === 'stopped' && (
        <div className="mb-3 rounded-[7px] bg-good-soft border border-good/20 px-3 py-2.5 text-[12px] text-good">
          <div className="font-medium">
            Ready — {preview.file.name} · {(preview.file.size / 1_048_576).toFixed(1)} MB
          </div>
          <div className="text-[11px] text-good/80 mt-0.5">
            Captured at {preview.startedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          {previewUrl && (
            <div className="mt-2.5 pt-2.5 border-t border-good/15">
              <div className="text-[10px] uppercase tracking-wide text-good/70 font-semibold mb-1.5">
                Preview before upload
              </div>
              <audio
                controls
                preload="metadata"
                src={previewUrl}
                className="w-full h-9 rounded-md"
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-3 text-[12px] text-bad leading-relaxed">
          {error}
          {micDenied && (
            <div className="text-[11px] text-muted mt-1">
              On iOS/Android, use HTTPS and allow microphone in browser settings.
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(status === 'idle' || status === 'stopped') && !preview && (
          <button
            type="button"
            disabled={disabled}
            onClick={start}
            className="px-3.5 py-2 rounded-[7px] bg-bad text-white text-[13px] font-semibold disabled:opacity-40"
          >
            ● Start recording
          </button>
        )}

        {status === 'recording' && (
          <>
            <button
              type="button"
              onClick={pause}
              className="px-3 py-2 rounded-[7px] border border-stone-300 bg-white text-[12.5px] font-semibold"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={stop}
              className="px-3.5 py-2 rounded-[7px] bg-ink text-white text-[13px] font-semibold"
            >
              ■ Stop
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              type="button"
              onClick={resume}
              className="px-3 py-2 rounded-[7px] bg-bad text-white text-[12.5px] font-semibold"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={stop}
              className="px-3.5 py-2 rounded-[7px] bg-ink text-white text-[13px] font-semibold"
            >
              ■ Stop
            </button>
          </>
        )}

        {preview && (
          <button
            type="button"
            disabled={busy}
            onClick={reset}
            className="px-3 py-2 rounded-[7px] border border-stone-300 bg-white text-[12.5px] font-semibold disabled:opacity-40"
          >
            Discard & re-record
          </button>
        )}
      </div>
    </div>
  );
}
