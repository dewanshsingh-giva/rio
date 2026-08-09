import 'server-only';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import ws from 'ws';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type RecordingsStorage = 'supabase' | 's3';

export interface PresignedUpload {
  provider: RecordingsStorage;
  /** Browser PUTs the file here — bytes never pass through RIO. */
  uploadUrl: string;
  method: 'PUT';
  /** Headers the browser must send with the PUT (e.g. Content-Type for S3). */
  headers: Record<string, string>;
  /** Pass this to Big Ears ingest as `s3Uri`. */
  s3Uri: string;
  bucket: string;
  key: string;
}

const UPLOAD_TTL_SEC = Number(process.env.STORAGE_UPLOAD_TTL_SEC ?? 900);

function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function s3Configured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET,
  );
}

/** Which backend RIO uses for presigned uploads. Set RECORDINGS_STORAGE or auto-detect. */
export function resolveRecordingsStorage(): RecordingsStorage {
  const explicit = process.env.RECORDINGS_STORAGE?.trim().toLowerCase();
  if (explicit === 'supabase' || explicit === 's3') return explicit;
  if (supabaseConfigured()) return 'supabase';
  if (s3Configured()) return 's3';
  throw new Error(
    'Recordings storage is not configured — set RECORDINGS_STORAGE=supabase or s3, ' +
      'and the matching credentials (SUPABASE_* or AWS_* + S3_BUCKET).',
  );
}

export function recordingsStorageConfigured(): boolean {
  try {
    resolveRecordingsStorage();
    return true;
  } catch {
    return false;
  }
}

function objectKey(filename: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'recording';
  return `${date}/${randomUUID().slice(0, 8)}-${safeName}`;
}

let supabaseClient: SupabaseClient | null = null;

function supabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Storage-only — Realtime still initializes; Node 20 needs ws.
      realtime: { transport: ws as never },
    });
  }
  return supabaseClient;
}

let s3Client: S3Client | null = null;

function s3(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION ?? 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

function supabaseBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET ?? 'bigears-recordings';
}

function s3Bucket(): string {
  return process.env.S3_BUCKET!;
}

export async function presignRecordingUpload(opts: {
  filename: string;
  contentType?: string;
}): Promise<PresignedUpload> {
  const provider = resolveRecordingsStorage();
  const key = objectKey(opts.filename || 'recording');
  const contentType = opts.contentType?.trim() || 'application/octet-stream';

  if (provider === 'supabase') {
    const bucket = supabaseBucket();
    const { data, error } = await supabase().storage.from(bucket).createSignedUploadUrl(key);
    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? `Could not presign upload for supabase://${bucket}/${key}`);
    }
    return {
      provider,
      uploadUrl: data.signedUrl,
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      s3Uri: `supabase://${bucket}/${key}`,
      bucket,
      key,
    };
  }

  const bucket = s3Bucket();
  const uploadUrl = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_TTL_SEC },
  );
  return {
    provider,
    uploadUrl,
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    s3Uri: `s3://${bucket}/${key}`,
    bucket,
    key,
  };
}
