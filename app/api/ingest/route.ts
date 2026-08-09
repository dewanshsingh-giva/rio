import { NextResponse } from 'next/server';
import { ApiError, ingestAudio, ingestTranscript } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * INGEST PROXY.
 *
 * The capture page is a client component, so it cannot hold `BIG_EARS_API_KEY`.
 * This forwards its request with the key attached and returns Big Ears'
 * response unchanged.
 *
 * Compare with what this file used to be: 227 lines that ran Deepgram and
 * twelve agents inside a Next.js request handler, streaming NDJSON back to
 * keep the connection alive. All of that is Big Ears' job now. What is left is
 * a credential boundary and nothing else — no validation, no business rules,
 * no second opinion about what a valid transcript looks like.
 */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const accepted = body.s3Uri ? await ingestAudio(body) : await ingestTranscript(body);
    return NextResponse.json(accepted, { status: 202 });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
