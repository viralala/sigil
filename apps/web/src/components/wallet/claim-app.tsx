"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fill } from "@/lib/i18n";
import { openSecretBox } from "@/lib/sealbox";
import { api, ApiError, kvGet, kvSet, signIn, type Packed, type StoredSeal } from "@/lib/wallet/client";
import { Button } from "@/components/ui/button";
import { Card as Box } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/components/site/i18n-provider";

/** Opens a bulk-issued claim link. The key is in the URL fragment, which never reaches the server. */
export function ClaimApp({ id }: { id: string }) {
  const { t } = useI18n();
  const c = t.site.claim;
  const [org, setOrg] = useState("");
  const [box, setBox] = useState("");
  const [state, setState] = useState<"load" | "ready" | "busy" | "done">("load");
  const [error, setError] = useState("");

  useEffect(() => {
    const key = new URLSearchParams(location.hash.slice(1)).get("k");
    if (!key) {
      setError(c.broken);
      return;
    }
    api<{ ciphertext: string; orgName: string }>(`/api/claim/${id}`)
      .then((r) => {
        setBox(r.ciphertext);
        setOrg(r.orgName);
        setState("ready");
      })
      .catch((e: ApiError) => setError(e.code === "ALREADY_CLAIMED" ? c.used : c.missing));
  }, [id, c]);

  async function add() {
    setState("busy");
    setError("");
    try {
      const key = new URLSearchParams(location.hash.slice(1)).get("k")!;
      const data = (await openSecretBox(box, key)) as { credential: Packed; holderJwk: JsonWebKey };
      await signIn();
      await api(`/api/claim/${id}`, { method: "POST" });
      const seals = (await kvGet<StoredSeal[]>("seals")) ?? [];
      await kvSet("seals", [...seals, { id, orgName: org, credential: data.credential, holderJwk: data.holderJwk }]);
      setState("done");
    } catch (e) {
      setState("ready");
      setError((e as ApiError).code === "ALREADY_CLAIMED" ? c.used : c.broken);
    }
  }

  return (
    <Box className="grid gap-4 p-6" data-testid="claim">
      {error ? (
        <p role="alert" className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="claim-error">
          {error}
        </p>
      ) : null}
      {state === "done" ? (
        <>
          <p role="status" className="m-0 flex items-center gap-2 text-xl font-bold" data-testid="claim-done">
            <Icon name="check" /> {c.done}
          </p>
          <Link href="/wallet" className="btn btn-flame">
            {c.open}
          </Link>
        </>
      ) : state !== "load" ? (
        <>
          <p className="m-0 text-xl font-bold">{fill(c.lead, { org })}</p>
          <Button block busy={state === "busy"} busyLabel={c.adding} onClick={add} data-testid="claim-add">
            {c.add}
          </Button>
        </>
      ) : null}
    </Box>
  );
}
