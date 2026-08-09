'use client';

import { useRef, useState } from 'react';
import PageHeader from '@/components/page-header';

interface Msg { role: 'user' | 'assistant'; text: string; source?: string }

const SUGGESTIONS = [
  'How many visits do we have and what are the average scores?',
  'Which staff member is performing best?',
  'Summarise the weakest visit and why',
  'What are customers asking for that we cannot fulfil?',
  'Compare Rahul vs Priya on sales effectiveness',
  'Which visits need follow-up?',
  'What did the customer want in visit v-9203?',
];

export default function Copilot() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'assistant',
    text: "I'm RIO Copilot. Ask me anything about your stores, visits, transcripts, staff scores, or customer demand — I read directly from MongoDB.",
  }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput('');
    const history = msgs.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-8);
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    setBusy(true);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question,
          history: history.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const j = await res.json();
      setMsgs((m) => [...m, res.ok
        ? { role: 'assistant', text: j.answer, source: j.source }
        : { role: 'assistant', text: j.error ?? 'Something went wrong.' }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: 'assistant', text: `Request failed: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }

  return (
    <>
      <PageHeader title="RIO Copilot" sub="Ask anything — answers come from your MongoDB visits and transcripts" />

      <div className="bg-white border border-line rounded-lg shadow-sm flex flex-col h-[74vh]">
        <div className="flex-1 overflow-auto p-5 flex flex-col gap-3.5">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[82%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' ? 'self-end bg-ink text-white rounded-br-sm' : 'self-start bg-stone-100 rounded-bl-sm'}`}>
              {m.text}
              {m.source && <div className="mt-2 pt-1.5 border-t border-stone-200 text-[10.5px] text-muted">{m.source}</div>}
            </div>
          ))}
          {busy && <div className="self-start bg-stone-100 px-3.5 py-2.5 rounded-xl rounded-bl-sm text-[13px] text-muted">Reading MongoDB…</div>}
          <div ref={endRef} />
        </div>

        <div className="border-t border-line p-3.5">
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} disabled={busy}
                className="text-[11.5px] px-2.5 py-1 rounded-full border border-line text-muted bg-stone-50/60 hover:border-accent hover:text-accent hover:bg-accent-soft disabled:opacity-40">
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask(input)}
              placeholder="Ask anything about your store data…"
              className="flex-1 text-[13px] px-3 py-2.5 border border-line rounded-lg outline-none focus:border-ink" />
            <button onClick={() => ask(input)} disabled={busy || !input.trim()}
              className="bg-ink text-white text-[13px] font-medium px-4 rounded-lg disabled:opacity-40">Ask</button>
          </div>
        </div>
      </div>
    </>
  );
}
