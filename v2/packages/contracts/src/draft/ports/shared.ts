/**
 * Read-model pieces shared by several ports (Appendix C M27).
 *
 * `attentionRow` carries pre-rendered words (Appendix C [P]), which conflicts with the rule that
 * reads return canonical states plus facts, never words (§1.5). It is used only by overview reads
 * whose screens come in Phases 2, 4, 5 and 6; its shape is PROVISIONAL until those screens are
 * built (provisional register).
 */
import { z } from 'zod';

import { recordRef } from '../kernel/primitives.js';
import type { Out } from './common.js';

export const attentionRow = z.object({
  text: z.string().min(1),
  context: z.string(),
  action: z.object({
    label: z.string().min(1),
    target: z.union([recordRef, z.string().min(1)]),
  }),
});

export type AttentionRow = Out<typeof attentionRow>;
