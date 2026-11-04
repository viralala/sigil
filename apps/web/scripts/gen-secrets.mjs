// One-off: generates the server secrets into the private folder (never the repo) and prints only the
// SCRAM verifier, so the database password itself is never sent anywhere but the env file.
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

const out = process.argv[2];
if (!out || existsSync(out)) throw new Error("pass a new output path");

const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16);
const iter = 4096;
const salted = pbkdf2Sync(password, salt, iter, 32, "sha256");
const clientKey = createHmac("sha256", salted).update("Client Key").digest();
const storedKey = createHash("sha256").update(clientKey).digest();
const serverKey = createHmac("sha256", salted).update("Server Key").digest();
const verifier = `SCRAM-SHA-256$${iter}:${salt.toString("base64")}$${storedKey.toString("base64")}:${serverKey.toString("base64")}`;

writeFileSync(
  out,
  JSON.stringify(
    {
      SIGIL_DB_PASSWORD: password,
      SIGIL_MASTER_KEY: randomBytes(32).toString("base64url"),
      SIGIL_SESSION_SECRET: randomBytes(32).toString("base64url"),
    },
    null,
    2,
  ),
);
console.log(verifier);
