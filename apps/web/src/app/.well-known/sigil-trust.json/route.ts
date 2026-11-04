import { trustList } from "@/lib/server/trust";
import { ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The 2-of-3 signed trust list, public, for anyone who wants to verify without us. */
export const GET = route("trust", 240, async () => ok(await trustList()));
