import { newChallenge } from "@/lib/server/session";
import { ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route("challenge", 60, async () => ok({ challenge: newChallenge() }));
