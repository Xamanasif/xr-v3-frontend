export declare const TOKENS_JSON: string;
export declare const SHEETS_DIRECTORY: string;
export declare const OUTPUT: string;
export declare const SHEETS: readonly string[];
export declare const APPROVED_THRESHOLDS: readonly {
  readonly name: string;
  readonly px: number;
  readonly meaning: string;
}[];
export declare function containersUsing(css: string, px: number): string[];
export declare function renderV46Constants(inputs: {
  readonly tokensJson: string;
  readonly css: string;
}): string;
export declare function readInputs(): { tokensJson: string; css: string };
