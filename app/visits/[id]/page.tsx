import { notFound } from 'next/navigation';
import { getVisitDetail } from '@/lib/api';
import VisitEvidence from '@/components/visit-evidence';

export const dynamic = 'force-dynamic';

export default async function VisitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getVisitDetail(id);
  if (!detail) notFound();

  return <VisitEvidence detail={detail} />;
}
