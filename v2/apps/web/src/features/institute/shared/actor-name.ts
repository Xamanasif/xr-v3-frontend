/**
 * Who did something, as the Institute Admin's records name them (moved here from
 * `ia-07-student-record/record-view.ts` — IA-09's record names its actors the same way).
 */
import type { ActorRef } from '@xr/domain';

/** Who did it, as the history and the inactive notice name them ("Meera Iyer"). */
export function actorName(actor: ActorRef): string | null {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return null;
}
