import { HubAssessmentTab } from '@/features/student/st-05-experiment-hub/hub-assessment-tab';

/** The experiment hub’s Assessment tab (ST-05; board B4-11 f7 … f9). */
export default async function PageHubAssessmentTab({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <HubAssessmentTab experimentId={experimentId} />;
}
