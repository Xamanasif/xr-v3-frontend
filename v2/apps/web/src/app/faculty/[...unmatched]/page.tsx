import { notFound } from 'next/navigation';

/** Any other address under `/faculty` — unknown, or designed but not built yet: PU-15 in the shell. */
export default function FacultyUnmatched(): never {
  notFound();
}
