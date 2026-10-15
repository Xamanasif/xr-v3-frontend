import { AccessPlanDetail } from '@/features/institute/ia-03-access-plan/access-plan';

/** IA-03 Access plan (board B2-03). */
export default async function InstituteAccessPlan({
  params,
}: {
  readonly params: Promise<{ readonly planId: string }>;
}) {
  const { planId } = await params;
  return <AccessPlanDetail planId={planId} />;
}
