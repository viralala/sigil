export type ForensicsErrorCode = 'not_an_image' | 'too_large' | 'too_small' | 'bad_input';

export class ForensicsError extends Error {
  readonly code: ForensicsErrorCode;
  constructor(code: ForensicsErrorCode, message: string);
}

export type ForensicsLevel = 'no_signs' | 'some_signs' | 'strong_signs';

export interface ForensicsSignal {
  id: string;
  /** Short sentence for ordinary people: 12 words or fewer, no jargon. */
  plain: string;
}

export interface ForensicsResult {
  /** Calibrated probability (0..1) that the picture shows signs of editing. Not a verdict; never use it to rank people. */
  score: number;
  /**
   * 'no_signs' does NOT mean verified or genuine; it means this check found nothing.
   * The strongest claim possible is 'strong_signs' of editing. Witness rule: machine checks are never stronger than "checked".
   */
  level: ForensicsLevel;
  /** Empty when level is 'no_signs'; otherwise up to three plain-language reasons. */
  signals: ForensicsSignal[];
  modelVersion: string;
}

/** Largest accepted input, in bytes (10 MB). */
export const MAX_BYTES: number;

/**
 * Look for signs of editing in a picture of a document (jpeg, png, webp, tiff, gif, heif, avif; at most 10 MB).
 * @throws ForensicsError with a typed `code` for non-images, oversize and too-small inputs.
 */
export function analyzeImage(input: Buffer | Uint8Array): Promise<ForensicsResult>;

/** Calibrated score from an already-computed feature vector (same order as modelInfo.featureNames). */
export function scoreFeatures(values: number[]): number;
export function levelOf(score: number): ForensicsLevel;

export const modelInfo: {
  version: string;
  kind: string;
  thresholds: { some: number; strong: number };
  featureNames: string[];
};
