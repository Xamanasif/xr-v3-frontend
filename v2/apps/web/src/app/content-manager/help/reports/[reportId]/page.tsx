import { ReportDetail } from '@/features/shared/xs-07-help/report-detail';

/** XS-07 Help & support — a report's detail (board 07). */
export default async function ContentManagerReport({
  params,
}: {
  readonly params: Promise<{ readonly reportId: string }>;
}) {
  const { reportId } = await params;
  return <ReportDetail reportId={reportId} />;
}
