import { FormatFeedback } from '@/features/student/st-16-feedback/format-feedback';

/** ST-16 Format feedback, with ST-17 Feedback sent as its read-only state (board B3-06). */
export default async function StudentFormatFeedback({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string; readonly format: string }>;
}) {
  const { experimentId, format } = await params;
  return <FormatFeedback experimentId={experimentId} format={format} />;
}
