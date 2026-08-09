'use client';

import Link from 'next/link';

const FEATURES = [
  { icon: '◎', title: 'Evidence, not vibes', desc: 'Each observation ships with a verbatim quote and confidence. Unclear audio is flagged — never scored as a miss.' },
  { icon: '◈', title: 'Coach with scripts', desc: 'Priority-ranked coaching with "say instead" lines in the language of the floor — not generic feedback.' },
  { icon: '◇', title: 'Demand you never heard', desc: 'Unfulfilled customer requests surface to merchandising — not just associate performance.' },
  { icon: '⟳', title: 'Follow-ups that matter', desc: 'High-intent visitors who left without buying land on tomorrow\'s call list with context attached.' },
  { icon: '⏺', title: 'Capture anywhere', desc: 'Record live from a tablet, upload a file, or paste a transcript — same pipeline either way.' },
  { icon: '✦', title: 'Manager copilot', desc: 'Ask questions across store data in plain language. Answers grounded in analysed visits only.' },
];

const STEPS = [
  { n: '01', t: 'Capture', d: 'Record on any device or upload. Audio goes straight to your storage — never through our servers.' },
  { n: '02', t: 'Understand', d: 'Big Ears transcribes, cleans noise, identifies speakers, and segments the visit into phases.' },
  { n: '03', t: 'Analyse', d: 'Twelve specialist agents run in layers — hospitality, sales, accuracy, signal, coaching, demand.' },
  { n: '04', t: 'Act', d: 'RIO surfaces scores, transcript flags, coaching scripts, and follow-ups — ready for the floor.' },
];

function Waveform() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-8 flex-1 min-w-0" aria-hidden>
      {[10, 18, 26, 14, 30, 22, 34, 16, 28, 20, 32, 12, 24, 18, 28, 10, 22, 16, 26, 14].map((h, i) => (
        <span
          key={i}
          className="block w-[3px] rounded-full bg-gradient-to-b from-[#D99A2B] to-[#B4780C] origin-bottom animate-wave-bar"
          style={{ height: h, animationDelay: `${(i * 0.08) % 0.35}s` }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="bg-ink text-stone-300 text-[11.5px] py-2 px-6 text-center">
        PII redacted before storage · Consent per visit · Built for DPDP 2023 · Hinglish-first transcription
      </div>

      <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-md border-b border-line">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-[34px] h-[34px] rounded-[9px] grid place-items-center text-xs font-extrabold text-white"
              style={{ background: 'linear-gradient(135deg,#D99A2B,#B4780C)' }}>RIO</span>
            <span>
              <b className="block text-sm tracking-tight">Retail Intelligence OS</b>
              <small className="text-[11px] text-muted">Powered by Big Ears</small>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted">
            <a href="#product" className="hover:text-ink">Product</a>
            <a href="#evidence" className="hover:text-ink">Evidence</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#platform" className="hover:text-ink">Platform</a>
          </nav>
          <Link href="/dashboard" className="bg-ink text-white text-[13px] font-semibold px-4 py-2.5 rounded-[9px] hover:bg-stone-700">
            Open dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1120px] mx-auto px-6 py-14 pb-[72px] grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent bg-accent-soft border border-accent-line rounded-full px-3 py-1.5 mb-5">
            Retail Intelligence System
          </div>
          <h1 className="font-serif text-[clamp(36px,5vw,52px)] leading-[1.08] tracking-tight font-bold">
            Every floor conversation,<br />turned into action.
          </h1>
          <p className="mt-[18px] text-[17px] text-stone-600 max-w-[480px] leading-relaxed">
            RIO is the manager-facing layer of the Retail Intelligence System.
            Capture visits, audit evidence line by line, coach associates, and
            recover revenue you didn&apos;t know you were losing.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link href="/visits" className="bg-ink text-white text-[13px] font-semibold px-[18px] py-2.5 rounded-[9px] hover:bg-stone-700">
              See a live visit
            </Link>
            <Link href="/ingest" className="border border-line text-[13px] font-semibold px-[18px] py-2.5 rounded-[9px] hover:border-stone-400">
              Record a conversation
            </Link>
          </div>
          <p className="mt-3.5 text-xs text-muted">No black-box scores · Every point traces to a quoted line</p>

          <div className="flex flex-wrap gap-2.5 mt-8">
            {[
              ['100%', 'Evidence auditable'],
              ['12', 'Specialist agents'],
              ['<2m', 'Analysis per visit'],
            ].map(([n, lbl]) => (
              <div key={lbl} className="bg-white border border-line rounded-xl px-4 py-3 min-w-[120px]">
                <div className="font-serif text-[22px] font-bold text-good">{n}</div>
                <div className="text-[11px] text-muted mt-0.5">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Product panel + sound waves */}
        <div className="relative">
          <div className="absolute -top-5 -inset-x-3 h-[120px] pointer-events-none opacity-55" aria-hidden>
            <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="w-full h-full" fill="none">
              <path d="M0 40 Q50 10 100 40 T200 40 T300 40 T400 40" stroke="#B4780C" strokeWidth="2" opacity=".25" />
              <path d="M0 48 Q50 68 100 48 T200 48 T300 48 T400 48" stroke="#3E5C76" strokeWidth="1.5" opacity=".2" />
              <path d="M0 32 Q50 52 100 32 T200 32 T300 32 T400 32" stroke="#146B4B" strokeWidth="1.5" opacity=".18" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center gap-3 bg-ink text-white rounded-t-xl px-3.5 py-2.5">
            <span className="w-2 h-2 rounded-full bg-[#e85d5d] animate-pulse-rec flex-none" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Recording</span>
            <Waveform />
            <span className="font-mono text-[11px] text-accent-soft">2:14</span>
          </div>

          <div className="relative z-10 border border-line border-t-0 rounded-b-2xl p-3.5 shadow-[0_24px_60px_rgba(29,27,24,.08)]"
            style={{ background: 'linear-gradient(145deg,#f3f0ea 0%,#fff 45%)' }}>
            <div className="flex gap-1.5 mb-3 px-1">
              {[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-stone-300" />)}
            </div>
            <div className="bg-paper border border-line rounded-[10px] overflow-hidden text-[11px]">
              <div className="px-3.5 py-2.5 border-b border-line flex justify-between items-center bg-white">
                <div>
                  <b className="text-xs">Gift visit</b>
                  <div className="text-[10px] text-muted mt-0.5">4m 32s · No purchase</div>
                </div>
                <span className="w-10 h-10 rounded-full border-4 border-good grid place-items-center font-serif font-bold text-[13px] text-good">72</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-white border-b border-line">
                {[
                  ['Hospitality', '83', ['Greeted', 'Water']],
                  ['Sales', '65', ['Close', 'Objection']],
                  ['Accuracy', '73', ['Buyback']],
                ].map(([label, score, caps]) => (
                  <div key={label as string} className="border border-line rounded-lg p-2 bg-white">
                    <div className="text-[8px] uppercase tracking-wide text-muted font-semibold">{label as string}</div>
                    <div className="font-serif text-base font-bold text-good">{score as string}</div>
                    <div className="flex flex-wrap gap-0.5 mt-1.5">
                      {(caps as string[]).map((c) => (
                        <span key={c} className="text-[8px] font-semibold px-1 py-px rounded-full bg-good-soft text-good">{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2.5">
                <div className="py-1.5 border-b border-stone-100">
                  <div className="text-[9px] font-bold uppercase text-info">Customer · 1:23</div>
                  <div className="mt-0.5">How do I know this silver is good quality?</div>
                  <span className="inline-block mt-1 text-[8px] font-semibold px-1.5 py-px rounded-full bg-bad-soft text-bad">Product story not told</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-[72px] px-6 bg-[#FFF5F0]" id="product">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2.5">Why RIO</div>
          <h2 className="font-serif text-[clamp(28px,4vw,36px)] tracking-tight max-w-[640px] leading-tight">
            Conversation intelligence managers can actually use.
          </h2>
          <p className="mt-3.5 text-base text-stone-600 max-w-[560px]">
            Not sentiment dashboards. Structured evidence, deterministic scores,
            and coaching lines your team can rehearse tomorrow morning.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-[#f0ddd4] rounded-[14px] p-[22px]">
                <div className="w-9 h-9 rounded-[9px] bg-accent-soft grid place-items-center text-base mb-3.5">{f.icon}</div>
                <h3 className="text-[15px] font-semibold mb-2">{f.title}</h3>
                <p className="text-[13px] text-muted leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence compare */}
      <section className="py-[72px] px-6" id="evidence">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2.5">The difference</div>
          <h2 className="font-serif text-[clamp(28px,4vw,36px)] tracking-tight max-w-[640px] leading-tight">
            A score you can defend in a one-on-one.
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            <div className="bg-stone-50 border border-line rounded-[14px] p-6">
              <h4 className="text-[11px] uppercase tracking-wider text-muted mb-3">Typical conversation AI</h4>
              <ul className="space-y-2 text-[13px]">
                {['Model outputs the score directly', 'Re-run and the number moves', '"Sentiment was positive" — then what?', 'No link to purchase outcome'].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-bad">✕</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white border-2 border-ink rounded-[14px] p-6">
              <h4 className="text-[11px] uppercase tracking-wider text-accent mb-3">Retail Intelligence OS</h4>
              <ul className="space-y-2 text-[13px]">
                {['Agents extract yes/no observations + quotes', 'Code computes scores from published weights', 'Coaching tied to exact transcript moments', 'Sale outcome from evidence, not heuristics'].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-good">✓</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-[72px] px-6 bg-[#FFF5F0]" id="how">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2.5">How it works</div>
          <h2 className="font-serif text-[clamp(28px,4vw,36px)] tracking-tight">From mic to manager brief in minutes.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white border border-[#f0ddd4] rounded-[14px] p-5">
                <div className="text-[11px] font-bold text-accent">{s.n}</div>
                <h4 className="font-semibold text-[15px] mt-1">{s.t}</h4>
                <p className="text-[13px] text-muted mt-2 leading-snug">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="py-[72px] px-6" id="platform">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2.5">Architecture</div>
          <h2 className="font-serif text-[clamp(28px,4vw,36px)] tracking-tight">Two products, one system.</h2>
          <p className="mt-3.5 text-base text-stone-600 max-w-[560px]">
            Big Ears is the agentic engine. RIO is the OS your managers open every morning.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className="border border-line rounded-[14px] p-[22px]">
              <div className="w-9 h-9 rounded-[9px] bg-stone-100 grid place-items-center mb-3.5">🎧</div>
              <h3 className="text-[15px] font-semibold mb-2">Big Ears</h3>
              <p className="text-[13px] text-muted leading-snug">Backend engine — transcript in, structured judgement out. Agents, scoring, persistence, REST API.</p>
            </div>
            <div className="border-2 border-ink rounded-[14px] p-[22px]">
              <div className="w-9 h-9 rounded-[9px] bg-accent-soft grid place-items-center text-sm font-bold mb-3.5">R</div>
              <h3 className="text-[15px] font-semibold mb-2">RIO</h3>
              <p className="text-[13px] text-muted leading-snug">Frontend OS — dashboards, visit explorer, capture, copilot. Talks to Big Ears only; no database of its own.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-stone-200 py-[72px] px-6 text-center">
        <h2 className="font-serif text-[clamp(28px,4vw,36px)] text-white tracking-tight">See it on a real conversation.</h2>
        <p className="mt-3 text-[15px] text-stone-400 max-w-lg mx-auto">
          The dashboard is live — transcript, evidence, scores, and coaching end to end.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5 justify-center">
          <Link href="/dashboard" className="bg-white text-ink text-[13px] font-semibold px-[18px] py-2.5 rounded-[9px] hover:bg-stone-100">
            Open dashboard
          </Link>
          <Link href="/ingest" className="border border-stone-600 text-stone-200 text-[13px] font-semibold px-[18px] py-2.5 rounded-[9px] hover:border-stone-400">
            Analyse a recording
          </Link>
        </div>
      </section>

      <footer className="max-w-[1120px] mx-auto px-6 py-10 text-[12.5px] text-muted flex flex-wrap gap-4 justify-between">
        <span>Retail Intelligence OS · Part of the Retail Intelligence System</span>
        <span>White-label ready · Evidence-first · DPDP by design</span>
      </footer>
    </div>
  );
}
