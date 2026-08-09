/** Presign + direct PUT to Supabase/S3. Returns the storage URI for Big Ears ingest. */
export async function uploadRecordingFile(file: File): Promise<string> {
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type || undefined }),
  });
  const presign = await presignRes.json();
  if (!presignRes.ok) {
    throw new Error(presign.error ?? `Presign failed (${presignRes.status})`);
  }

  const putRes = await fetch(presign.uploadUrl as string, {
    method: presign.method ?? 'PUT',
    headers: presign.headers ?? {},
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload to storage failed (${putRes.status})`);
  }

  return presign.s3Uri as string;
}
