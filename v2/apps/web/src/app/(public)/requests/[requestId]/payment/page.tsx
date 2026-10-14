import { PaymentPage } from '@/features/public/pu-12-payment/payment';

/** PU-12 Payment (B1-08 f5): external route only, behind the same gate as PU-10 (O-05). */
export default async function PublicPayment({
  params,
}: {
  readonly params: Promise<{ readonly requestId: string }>;
}) {
  const { requestId } = await params;
  return <PaymentPage routeId={requestId} />;
}
