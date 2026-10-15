import { FormatPage } from '@/features/student/st-09-format/format-page';

/** ST-09 AR / VR / MR format — setup and progress (board B3-04); any other format is not found. */
export default async function StudentFormatPage({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string; readonly format: string }>;
}) {
  const { experimentId, format } = await params;
  return <FormatPage experimentId={experimentId} format={format} />;
}
