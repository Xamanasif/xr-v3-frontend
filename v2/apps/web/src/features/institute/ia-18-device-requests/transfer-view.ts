/**
 * Moved to `features/institute/shared/transfer-view` (IA V3 settlement, frozen API — see
 * `shared/README.md`). This re-export keeps the old path compiling for its importers.
 */
export {
  newestFirst,
  type StudentNames,
  type StudentNaming,
  studentOf,
  TRANSFER_TONE,
  type TransferHistoryLine,
  transferHistoryLines,
  transferStatusWords,
} from '../shared/transfer-view';
