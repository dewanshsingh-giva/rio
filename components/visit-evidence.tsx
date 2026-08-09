import type { VisitDetail } from '@/lib/api';
import VisitDetailView from '@/components/visit-detail-view';

export default function VisitEvidence({ detail }: { detail: VisitDetail }) {
  return <VisitDetailView detail={detail} />;
}
