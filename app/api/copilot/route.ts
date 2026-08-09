import { NextResponse } from 'next/server';
import { ApiError, askCopilot } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Copilot proxy. The LLM call, the prompt and the data snapshot all live in Big Ears. */
export async function POST(req: Request) {
  try {
    return NextResponse.json(await askCopilot(await req.json()));
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
