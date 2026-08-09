import { NextResponse } from 'next/server';
import { ApiError, getJob } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Job status proxy — polled by the capture page every couple of seconds. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(await getJob(id));
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
