import { notFound } from 'next/navigation';

/** Any other address under `/content-manager` — unknown, or designed but not built yet: PU-15 in the shell. */
export default function ContentManagerUnmatched(): never {
  notFound();
}
