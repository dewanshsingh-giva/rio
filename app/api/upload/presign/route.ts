import { NextResponse } from 'next/server';
import { presignRecordingUpload, recordingsStorageConfigured } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * Mint a presigned PUT URL so the browser uploads directly to Supabase or S3.
 * RIO never receives file bytes — only filename + content-type to sign the upload.
 */
export async function POST(req: Request) {
  if (!recordingsStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          'Recordings storage is not configured — set RECORDINGS_STORAGE and matching credentials in RIO.',
      },
      { status: 503 },
    );
  }

  let body: { filename?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON body with filename.' }, { status: 400 });
  }

  const filename = body.filename?.trim();
  if (!filename) {
    return NextResponse.json({ error: 'filename is required.' }, { status: 400 });
  }

  try {
    const presigned = await presignRecordingUpload({
      filename,
      contentType: body.contentType,
    });
    return NextResponse.json(presigned);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
