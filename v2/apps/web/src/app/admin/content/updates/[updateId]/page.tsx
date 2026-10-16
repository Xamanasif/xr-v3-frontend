import { UpdateDecision } from '@/features/admin/sa-11-update-decision/update-decision';

/** SA-11 Release or hold an update (boards B7-05, B7-10, B7-11) — never “Publish”. */
export default async function PageUpdateDecision({
  params,
}: {
  readonly params: Promise<{ readonly updateId: string }>;
}) {
  const { updateId } = await params;
  return <UpdateDecision updateId={updateId} />;
}
