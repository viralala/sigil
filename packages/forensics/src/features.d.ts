export const FEATURE_VERSION: number;
export const MAX_SIDE: number;
export class ForensicsError extends Error {
  readonly code: 'not_an_image' | 'too_large' | 'too_small' | 'bad_input';
  constructor(code: 'not_an_image' | 'too_large' | 'too_small' | 'bad_input', message: string);
}
/** One numeric feature vector per image. The same code is used for training and serving. */
export function extractFeatures(input: Uint8Array): Promise<{ names: string[]; values: number[] }>;
/** Batch jobs (training): one libvips thread per worker, no cache. */
export function tuneForBatch(): void;
