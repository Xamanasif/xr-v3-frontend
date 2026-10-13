import { notFound } from 'next/navigation';

/** Any other address under `/vendor` — unknown, or designed but not built yet: PU-15 in the shell. */
export default function VendorUnmatched(): never {
  notFound();
}
