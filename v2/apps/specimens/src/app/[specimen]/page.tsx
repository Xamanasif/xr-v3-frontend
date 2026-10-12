import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { parseContentWidth, SpecimenFrame } from '@/specimens/frame';
import { specimenFor } from '@/specimens/registry';

interface SpecimenPageProps {
  readonly params: Promise<{ specimen: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: SpecimenPageProps): Promise<Metadata> {
  const specimen = specimenFor((await params).specimen);
  return { title: specimen ? `Specimen — ${specimen.title}` : 'Specimen not found' };
}

/** `/<specimen-id>?width=<content px>` — one specimen, framed at a content width. */
export default async function SpecimenPage({ params, searchParams }: SpecimenPageProps) {
  const specimen = specimenFor((await params).specimen);
  const width = parseContentWidth((await searchParams)['width']);
  if (!specimen || width === 'invalid') notFound();
  return <SpecimenFrame width={width}>{specimen.render()}</SpecimenFrame>;
}
