import { GroupRecord } from '@/features/institute/ia-14-group/group-record';

/** IA-14 Group (board B2-08 f3 … f10). */
export default async function InstituteGroup({
  params,
}: {
  readonly params: Promise<{ readonly groupId: string }>;
}) {
  const { groupId } = await params;
  return <GroupRecord groupId={groupId} />;
}
