import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

// Sessions: an HMAC-signed httpOnly cookie. Holders prove a device key; issuers prove an org access code.
const secret = () => {
  const s = process.env.SIGIL_SESSION_SECRET;
  if (!s) throw new Error("SIGIL_SESSION_SECRET missing");
  return s;
};
const mac = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export type Role = "wallet" | "issuer";
const COOKIE: Record<Role, string> = { wallet: "sigil-wallet", issuer: "sigil-issuer" };
const TTL: Record<Role, number> = { wallet: 7 * 864e5, issuer: 8 * 36e5 };

function pack(o: object) {
  const v = Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${v}.${mac(v)}`;
}
function unpack<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [v, m] = token.split(".");
  if (!v || !m || !same(m, mac(v))) return null;
  try {
    return JSON.parse(Buffer.from(v, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export async function startSession(role: Role, sub: string) {
  const exp = Date.now() + TTL[role];
  (await cookies()).set(COOKIE[role], pack({ sub, exp }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.SIGIL_INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: TTL[role] / 1000,
  });
}

export async function endSession(role: Role) {
  (await cookies()).delete(COOKIE[role]);
}

export async function sessionOf(role: Role): Promise<string | null> {
  const s = unpack<{ sub: string; exp: number }>((await cookies()).get(COOKIE[role])?.value);
  return s && s.exp > Date.now() ? s.sub : null;
}

/** A signed, short-lived login challenge. One-time: spent in used_nonces when redeemed. */
export function newChallenge() {
  return pack({ n: randomBytes(16).toString("base64url"), exp: Date.now() + 120_000 });
}

export async function spendChallenge(challenge: string): Promise<boolean> {
  const c = unpack<{ n: string; exp: number }>(challenge);
  if (!c || c.exp < Date.now()) return false;
  const sql = db();
  const rows = await sql`insert into used_nonces (nonce, expires_at) values (${c.n}, ${new Date(c.exp)})
    on conflict do nothing returning nonce`;
  await sql`delete from used_nonces where expires_at < now()`;
  return rows.length === 1;
}

export function hashCode(code: string) {
  const salt = randomBytes(16);
  return `${salt.toString("base64url")}.${scryptSync(code, salt, 32).toString("base64url")}`;
}

export function checkCode(code: string, stored: string | null) {
  if (!stored) return false;
  const [salt, hash] = stored.split(".");
  return same(scryptSync(code, Buffer.from(salt, "base64url"), 32).toString("base64url"), hash);
}

/** A salted, per-day hash of the viewer: lets a receipt count views without keeping an IP. */
export function viewerTag(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return mac(`${ip}|${new Date().toISOString().slice(0, 10)}`).slice(0, 16);
}
