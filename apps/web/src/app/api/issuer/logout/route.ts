import { endSession } from "@/lib/server/session";
import { ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route("issuer-logout", 30, async () => {
  await endSession("issuer");
  return ok({ done: true });
});
