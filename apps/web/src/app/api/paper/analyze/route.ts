import { analyzeImage } from "@sigil/forensics";
import { fail, ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Machine look for edits. The image is read in memory and dropped; only the result leaves this function. */
export const POST = route("paper-analyze", 20, async (req) => {
  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0) return fail("NOT_IMAGE", 400);
  if (buf.length > 4_200_000) return fail("TOO_BIG", 413);
  try {
    return ok(await analyzeImage(buf));
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code) return fail("NOT_IMAGE", 400);
    throw e;
  }
});
