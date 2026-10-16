import { RoleHolder } from '@/features/admin/sa-17-role-holder/role-holder';

/** SA-17 Role holder (boards B7-08 f1, f2, f4, f5, f8; B7-10). */
export default async function PageRoleHolder({
  params,
}: {
  readonly params: Promise<{ readonly holderId: string }>;
}) {
  const { holderId } = await params;
  return <RoleHolder holderId={holderId} />;
}
