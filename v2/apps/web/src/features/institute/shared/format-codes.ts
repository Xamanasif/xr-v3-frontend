/**
 * A plan's formats as the kit's format codes, in the display order WEB · AR · VR · MR (moved here
 * from `ia-06-people/students.tsx` — IA-07, IA-13 and IA-14 draw them too).
 */
import { inDisplayOrder } from '@xr/domain';
import type { FormatCode } from '@xr/ui';

import { formatName } from '@/copy/flow-state-words';

/** The plan's formats as chips, in the display order WEB · AR · VR · MR. */
export function formatCodes(formats: Parameters<typeof inDisplayOrder>[0]): FormatCode[] {
  return inDisplayOrder(formats).map((format) => formatName(format) as FormatCode);
}
