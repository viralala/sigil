// @sigil/parser: resume text -> proposed claims. Proposals only: the holder confirms every card.
// Nothing here says a claim is true, and nothing scores or ranks a person.

/** The product's claim kinds. */
export type ClaimKind = "education" | "job" | "certificate" | "skill" | "publication" | "patent" | "award" | "event" | "other";

export interface Claim {
  /** "c1", "c2", ... in document order. Stable for the same input. */
  id: string;
  kind: ClaimKind;
  /** A piece of the input line(s), whitespace collapsed. */
  title: string;
  /** Employer / college / issuer / venue, as written. null when the text does not name one. */
  org: string | null;
  /** "YYYY", "YYYY-MM" or "YYYY-MM-DD", read from the text. null when absent. */
  from: string | null;
  /** Same formats, or the literal "present" for an open end. For a single date on an education line this holds it (graduation). */
  to: string | null;
  /** 0..1: how sure the reader is that it read this line correctly. NOT a measure of the person or of truth. */
  confidence: number;
  /** The exact line(s) of the input (invisible characters removed) this claim came from, joined by "\n". */
  source: string;
}

export interface ParseResult {
  claims: Claim[];
  /** Plain-language notes for the holder (hidden characters removed, lines that looked like instructions skipped, ...). Never echo input text. */
  warnings: string[];
}

export interface ClassifyResult {
  kind: ClaimKind;
  /** Model probability of `kind`, 0..1. 0 when the text has no readable words. */
  confidence: number;
}

export interface TimelineFlag {
  type: "OVERLAP" | "END_BEFORE_START";
  /** Claim id. */
  a: string;
  /** Claim id of the second job (OVERLAP only). */
  b?: string;
}

export type ResumeInputErrorCode = "TOO_LARGE" | "NOT_A_STRING";

/** Thrown by parseResume for input that is not a string or is larger than MAX_INPUT_BYTES. */
export class ResumeInputError extends Error {
  readonly name: "ResumeInputError";
  readonly code: ResumeInputErrorCode;
}

/** 200 KB (204,800 bytes of UTF-8). */
export const MAX_INPUT_BYTES: number;

/** The nine kinds the classifier can propose. */
export const CLAIM_KINDS: ClaimKind[];

/** Read resume text into proposed claims. Pure, synchronous, no network. Throws ResumeInputError. */
export function parseResume(text: string): ParseResult;

/** Propose a kind for one line of text (first 400 characters). Never throws. */
export function classifyClaim(text: string): ClassifyResult;

/** Questions for the holder: overlapping full-time jobs and end-before-start dates. Not a verdict. */
export function timelineFlags(claims: ReadonlyArray<Pick<Claim, "id" | "kind" | "title" | "from" | "to"> & Partial<Pick<Claim, "source">>>): TimelineFlag[];
