/**
 * ST-19 Experiment not available lives in `features/student/shared/not-available.tsx` since the
 * Student V3 settlement: the hub frame, ST-08/ST-09 and ST-12/ST-14 render it in place of a refused
 * page. This path re-exports it (frozen API) for any import that still names it.
 */
export { NOT_AVAILABLE_TITLE, NotAvailable } from '../shared/not-available';
