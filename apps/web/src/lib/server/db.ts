import "server-only";
import postgres from "postgres";

// One small pool per server process, through the Supabase pooler as the sigil_app role.
const g = globalThis as unknown as { __sigilSql?: postgres.Sql };

export function db(): postgres.Sql {
  const url = process.env.SIGIL_DB_URL;
  if (!url) throw new Error("SIGIL_DB_URL missing");
  g.__sigilSql ??= postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10, ssl: "require" });
  return g.__sigilSql;
}
