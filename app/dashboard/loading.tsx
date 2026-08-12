'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui';

/**
 * Shown automatically by Next during navigation to /dashboard while the
 * (force-dynamic) server component awaits Big Ears. The dashboard is slow
 * today; until we fix it, this at least makes the wait honest and fun —
 * a conversation-waveform loader with a rotating set of self-aware notes.
 */
const NOTES = [
  'Warming up Big Ears…',
  'Counting every visit by hand (we know, we know)…',
  'Yes, this is slow. Yes, we are fixing it. 🛠️',
  'Convincing the server to hurry up…',
  'Crunching transcripts, evidence, and scores…',
  'Almost there — thanks for your patience 🙏',
];

export default function DashboardLoading() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % NOTES.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <PageHeader title="Home" sub="Loading your dashboard…" />
      <Card>
        <div className="py-14 px-6 flex flex-col items-center text-center">
          {/* Conversation-waveform loader — reuses the existing wave-bar keyframe */}
          <div className="flex items-end gap-1.5 h-12" aria-hidden>
            {[0, 1, 2, 3, 4, 5, 6].map((b) => (
              <span
                key={b}
                className="animate-wave-bar block w-1.5 h-full rounded-full bg-good origin-bottom"
                style={{ animationDelay: `${b * 0.12}s` }}
              />
            ))}
          </div>

          <div className="mt-6 text-[13px] font-medium text-ink min-h-[1.25rem] transition-opacity">
            {NOTES[i]}
          </div>
          <div className="mt-1.5 text-xs text-muted max-w-sm leading-relaxed">
            This page is slower than it should be right now — a fix is on the way.
          </div>
        </div>
      </Card>
    </>
  );
}
