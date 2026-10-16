import { Correction } from '@/features/content-manager/cm-08-updates/correction';

/** CM-08 an update — the correction draft CM-06 / CM-07 open, and every later state (boards B6-09, B6-11, B6-13, B7-11). */
export default async function PageCorrection({
  params,
}: {
  readonly params: Promise<{ readonly updateId: string }>;
}) {
  const { updateId } = await params;
  return <Correction updateId={updateId} />;
}
