// Turns what a recruiter pastes or scans into a share id. We only parse; we never fetch the URL (no SSRF).
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

export type LinkResult = { ok: true; id: string } | { ok: false; error: "EMPTY" | "TOO_LONG" | "NOT_SIGIL" };

export function parseShareLink(raw: unknown): LinkResult {
  if (typeof raw !== "string" || raw.trim() === "") return { ok: false, error: "EMPTY" };
  const input = raw.trim();
  if (input.length > 500) return { ok: false, error: "TOO_LONG" };
  if (ID.test(input)) return { ok: true, id: input };
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "NOT_SIGIL" };
    const m = url.pathname.match(/^\/s\/([^/]+)\/?$/);
    const fromQuery = url.pathname.replace(/\/$/, "") === "/check" ? url.searchParams.get("s") : null;
    const id = m?.[1] ?? fromQuery;
    if (id && ID.test(id)) return { ok: true, id };
  } catch {
    /* not a URL */
  }
  return { ok: false, error: "NOT_SIGIL" };
}
