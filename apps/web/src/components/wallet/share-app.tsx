"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fill } from "@/lib/i18n";
import { api, ApiError, kvGet, newShareId, present, sealBundle, sync, type Card, type SelfClaim, type StoredSeal } from "@/lib/wallet/client";
import { Button } from "@/components/ui/button";
import { Card as Box } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/components/site/i18n-provider";

type Pick = { seal: StoredSeal; keys: Record<string, boolean> };
const DAYS = [1, 7, 30];

/** The consent screen: what they will see, what stays hidden, for how long. */
export function ShareApp() {
  const { t } = useI18n();
  const s = t.site.share;
  const w = t.site.wallet;
  const f = t.result.field;
  const [ready, setReady] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [self, setSelf] = useState<(Card & { on: boolean })[]>([]);
  const [name, setName] = useState("");
  const [showName, setShowName] = useState(true);
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { me, seals } = await sync();
        const live = seals.filter((x) => !me.seals.find((m) => m.id === x.id)?.revoked_at);
        setPicks(live.map((seal) => ({ seal, keys: Object.fromEntries(seal.credential.leaves.map((l) => [l.key, true])) })));
        const cards = (await kvGet<Card[]>("cards")) ?? [];
        const sealedReq = new Set(me.seals.map((m) => m.request_id));
        setSelf(cards.filter((c) => !c.requestId || !sealedReq.has(c.requestId)).map((c) => ({ ...c, on: false })));
        setName((await kvGet<string>("name")) ?? "");
      } catch (e) {
        setError(w.errors[(e as ApiError).code] ?? w.errors.SERVER);
      } finally {
        setReady(true);
      }
    })();
  }, [w.errors]);

  const shown = [...picks.flatMap((p) => Object.entries(p.keys).filter(([, v]) => v).map(([k]) => k)), ...self.filter((c) => c.on).map(() => "self")];
  const hidden = picks.flatMap((p) => Object.entries(p.keys).filter(([, v]) => !v).map(([k]) => k));

  async function create() {
    setError("");
    if (!shown.length) return setError(s.nothing);
    setBusy(true);
    try {
      const id = newShareId();
      const presentations = [];
      for (const p of picks) {
        const reveal = Object.entries(p.keys).filter(([, v]) => v).map(([k]) => k);
        if (reveal.length) presentations.push(await present(p.seal, reveal, id, days));
      }
      const selfClaims: SelfClaim[] = self.filter((c) => c.on).map(({ kind, title, org, from, to }) => ({ kind, title, org, from, to }));
      const { box, key } = await sealBundle({ name: showName ? name || null : null, presentations, self: selfClaims });
      await api("/api/shares", { method: "POST", json: { id, ciphertext: box, shown: [...new Set(shown)], days } });
      const url = `${location.origin}/s/${id}#k=${key}`;
      setLink(url);
      const QR = (await import("qrcode")).default;
      setQr(await QR.toDataURL(url, { margin: 1, width: 300, errorCorrectionLevel: "L", color: { dark: "#0B2350", light: "#FFFDF8" } }));
    } catch (e) {
      setError(w.errors[(e as ApiError).code] ?? w.errors.SERVER);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(s.copied);
    } catch {
      setCopied(s.copyFailed);
    }
  }

  if (!ready)
    return (
      <p role="status" className="m-0 text-lg font-bold">
        {w.starting}
      </p>
    );

  if (link)
    return (
      <Box className="grid gap-4 p-5 sm:p-7" data-testid="share-done">
        <h2 className="text-4xl">{s.done}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL made in the browser */}
        {qr ? <img src={qr} alt={s.qrAlt} width={260} height={260} className="rounded-[var(--r-sm)] border-2 border-navy" /> : null}
        <label className="grid gap-1 font-bold">
          {s.linkLabel}
          <input readOnly value={link} className="field font-mono text-sm" onFocus={(e) => e.target.select()} data-testid="share-link" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button tone="cream" block onClick={copy} data-testid="share-copy">
            <Icon name="copy" /> {s.copy}
          </Button>
          <a className="btn btn-flame" href={`https://wa.me/?text=${encodeURIComponent(`${s.whatsappText} ${link}`)}`} target="_blank" rel="noopener noreferrer">
            {s.whatsapp}
          </a>
        </div>
        <p role="status" className="m-0 min-h-6 font-bold">
          {copied}
        </p>
        <Link href="/wallet/activity" className="font-bold text-navy">
          {t.site.wallet.activity}
        </Link>
      </Box>
    );

  if (!picks.length && !self.length)
    return (
      <Box className="grid gap-4 p-6">
        <p className="m-0 text-lg font-bold">{s.empty}</p>
        <Link href="/wallet/resume" className="btn btn-flame">
          {w.resume}
        </Link>
      </Box>
    );

  return (
    <div className="grid gap-5" data-testid="consent">
      {error ? (
        <p role="alert" className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="share-error">
          {error}
        </p>
      ) : null}
      {picks.map((p, i) => (
        <fieldset key={p.seal.id} className="card m-0 grid gap-2 p-5">
          <legend className="tag !bg-ok !text-white">{fill(w.sealed, { org: p.seal.orgName })}</legend>
          {p.seal.credential.leaves.map((l) => (
            <label key={l.key} className="flex min-h-12 items-center justify-between gap-3 font-medium">
              <span>
                <b>{f[l.key] ?? l.key}:</b> {String(l.value)}
              </span>
              <input
                type="checkbox"
                className="h-6 w-6"
                checked={p.keys[l.key]}
                data-testid={`toggle-${l.key}`}
                onChange={(e) => setPicks((all) => all.map((x, j) => (j === i ? { ...x, keys: { ...x.keys, [l.key]: e.target.checked } } : x)))}
              />
            </label>
          ))}
        </fieldset>
      ))}
      {self.length ? (
        <fieldset className="card m-0 grid gap-2 p-5">
          <legend className="tag !bg-cream-2">{s.selfNote}</legend>
          {self.map((c) => (
            <label key={c.id} className="flex min-h-12 items-center justify-between gap-3 font-medium">
              <span>{c.title}</span>
              <input type="checkbox" className="h-6 w-6" checked={c.on} data-testid="toggle-self" onChange={(e) => setSelf((all) => all.map((x) => (x.id === c.id ? { ...x, on: e.target.checked } : x)))} />
            </label>
          ))}
        </fieldset>
      ) : null}
      <Box className="grid gap-3 p-5">
        <label className="flex min-h-12 items-center justify-between gap-3 font-bold">
          {s.nameToggle} {name ? `(${name})` : ""}
          <input type="checkbox" className="h-6 w-6" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
        </label>
        <label className="grid gap-1 font-bold">
          {s.expiry}
          <select className="field" value={days} onChange={(e) => setDays(Number(e.target.value))} data-testid="days">
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {fill(s.days, { n: d })}
              </option>
            ))}
          </select>
        </label>
        <p className="m-0 font-medium" data-testid="see-summary">
          <Icon name="eye" className="inline" /> <b>{s.see}:</b> {[...new Set(shown)].map((k) => (k === "self" ? s.selfNote : f[k] ?? k)).join(", ") || "-"}
        </p>
        <p className="m-0 font-medium" data-testid="hidden-summary">
          <Icon name="lock" className="inline" /> <b>{s.hidden}:</b> {[...new Set(hidden)].map((k) => f[k] ?? k).join(", ") || "-"}
        </p>
      </Box>
      <Button block busy={busy} busyLabel={s.creating} onClick={create} data-testid="create-share">
        <Icon name="qr" /> {s.create}
      </Button>
    </div>
  );
}
