import { SupportReport } from '@/features/admin/sa-21-support-report/support-report';

/** SA-21 Support report (boards B7-09 f8 … f12, f14; B7-10). */
export default async function PageSupportReport({
  params,
}: {
  readonly params: Promise<{ readonly reportId: string }>;
}) {
  const { reportId } = await params;
  return <SupportReport reportId={reportId} />;
}
