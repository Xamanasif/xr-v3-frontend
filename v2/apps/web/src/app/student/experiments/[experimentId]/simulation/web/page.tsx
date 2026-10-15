import { WebSimulation } from '@/features/student/st-08-web-simulation/web-simulation';

/** ST-08 WEB simulation — launch and resume (board B3-03). */
export default async function StudentWebSimulation({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <WebSimulation experimentId={experimentId} />;
}
