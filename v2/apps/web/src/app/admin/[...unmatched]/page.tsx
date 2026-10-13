import { notFound } from 'next/navigation';

/** Any other address under `/admin` — unknown, or designed but not built yet: PU-15 in the shell. */
export default function AdminUnmatched(): never {
  notFound();
}
