export interface BoardFile {
  readonly file: string;
  readonly html: string;
}
export declare const BOARDS_DIRECTORY: string;
export declare const OUTPUT: string;
export declare const USE_NAMES: Readonly<Record<string, string>>;
export declare const SCRIPT_NAMES: Readonly<
  Record<string, { readonly path: string; readonly boards: readonly string[] }>
>;
export declare function nameFor(label: string): string;
export declare function readBoards(directory?: string): BoardFile[];
export declare function boardTwoIcons(
  boards: readonly BoardFile[],
): { label: string; path: string }[];
export declare function drawnIconPaths(
  boards: readonly BoardFile[],
): Map<string, { uses: number; boards: Set<string> }>;
export declare function formatGlyphs(boards: readonly BoardFile[]): Map<string, string>;
export declare function renderIconRegistry(boards: readonly BoardFile[]): string;
