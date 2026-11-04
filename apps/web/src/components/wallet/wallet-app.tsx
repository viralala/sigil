"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fill } from "@/lib/i18n";
import { api, ApiError, kvGet, kvSet, sync, wipeLocal, type Card, type Me, type StoredSeal } from "@/lib/wallet/client";
import { Button } from "@/components/ui/button";
import { Card as Box } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { useI18n } from "@/components/site/i18n-provider";

type Org = { id: string; name: string; state: string; can_confirm: boolean; sample: boolean };

export function WalletApp() {
  const { t } = useI18n();
  const w = t.site.wallet;
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [seals, setSeals] = useState<StoredSeal[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [asking, setAsking] = useState<string | null>(null);
  const [org, setOrg] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [erasing, setErasing] = useState(false);
  const [gone, setGone] = useState(false);
  const say = useCallback((e: unknown) => setError(w.errors[(e as ApiError).code] ?? w.errors.SERVER), [w.errors]);

  const refresh = useCallback(async () => {
    const r = await sync();
    setMe(r.me);
    setSeals(r.seals);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [n, c] = await Promise.all([kvGet<string>("name"), kvGet<Card[]>("cards")]);
        setName(n ?? "");
        setSaved(Boolean(n));
        setCards(c ?? []);
        await refresh();
        const { orgs } = await api<{ orgs: Org[] }>("/api/orgs");
        setOrgs(orgs.filter((o) => o.can_confirm && o.state === "active"));
      } catch (e) {
        say(e);
      } finally {
        setReady(true);
      }
    })();
  }, [refresh, say]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(w.errors.NO_NAME);
    await kvSet("name", name.trim());
    setSaved(true);
    setError("");
  }

  async function ask(card: Card) {
    if (!saved) return setError(w.errors.NO_NAME);
    const target = orgs.find((o) => o.id === org);
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      const { id } = await api<{ id: string }>("/api/requests", {
        method: "POST",
        json: { orgId: target.id, kind: card.kind, fields: { name, title: card.title, from: card.from, to: card.to } },
      });
      const next = cards.map((c) => (c.id === card.id ? { ...c, requestId: id } : c));
      setCards(next);
      await kvSet("cards", next);
      setAsking(null);
      await refresh();
    } catch (e) {
      say(e);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    await kvSet("cards", next);
  }

  async function check() {
    setRefreshing(true);
    setError("");
    try {
      await refresh();
      setNote(w.refreshed);
    } catch (e) {
      say(e);
    } finally {
      setRefreshing(false);
    }
  }

  async function erase() {
    setBusy(true);
    try {
      await api("/api/wallet/me", { method: "DELETE" });
      await wipeLocal();
      setGone(true);
    } catch (e) {
      say(e);
    } finally {
      setBusy(false);
    }
  }

  if (gone)
    return (
      <p role="status" className="card m-0 p-6 text-xl font-bold" data-testid="wallet-gone">
        {w.erased}
      </p>
    );
  if (!ready)
    return (
      <p role="status" className="m-0 text-lg font-bold" data-testid="wallet-loading">
        {w.starting}
      </p>
    );

  const sealFor = (c: Card) => {
    const s = c.requestId ? me?.seals.find((x) => x.request_id === c.requestId) : undefined;
    return s;
  };
  const claimed = (me?.seals ?? []).filter((s) => !s.request_id);

  return (
    <div className="grid gap-6" data-testid="wallet">
      {error ? (
        <p role="alert" className="m-0 flex items-center gap-2 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="wallet-error">
          <Icon name="cross" /> {error}
        </p>
      ) : null}

      <Box className="p-5">
        <form onSubmit={saveName} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-1 font-bold">
            {w.nameLabel}
            <input className="field" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} maxLength={80} autoComplete="name" data-testid="name" />
          </label>
          <Button type="submit" tone="cream" data-testid="save-name">
            {saved ? <Icon name="check" /> : null} {w.save}
          </Button>
        </form>
        <p className="mt-2 mb-0 text-sm font-medium">{w.nameHint}</p>
      </Box>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/wallet/resume" className="btn btn-flame" data-testid="to-resume">
          <Icon name="upload" /> {w.resume}
        </Link>
        <Link href="/wallet/share" className="btn btn-royal" data-testid="to-share">
          <Icon name="qr" /> {w.share}
        </Link>
        <Link href="/wallet/activity" className="btn btn-cream" data-testid="to-activity">
          <Icon name="eye" /> {w.activity}
        </Link>
      </div>

      {cards.length === 0 && claimed.length === 0 ? (
        <Box className="p-6">
          <p className="m-0 text-lg font-bold">{w.empty}</p>
        </Box>
      ) : null}

      <ul className="m-0 grid list-none gap-4 p-0" data-testid="cards">
        {claimed.map((s) => {
          const local = seals.find((x) => x.id === s.id);
          const title = String(local?.credential.leaves.find((l) => l.key === "title")?.value ?? w.kinds[s.kind]);
          return (
            <li key={s.id} className="card grid gap-2 p-5" data-testid="seal-card">
              <span className="label text-muted">{w.kinds[s.kind] ?? s.kind}</span>
              <p className="m-0 font-display text-3xl font-black uppercase leading-none">{title}</p>
              {s.revoked_at ? <StatusBadge tone="red" label={fill(w.cancelled, { org: s.org_name })} /> : <StatusBadge tone="green" label={fill(w.sealed, { org: s.org_name })} />}
            </li>
          );
        })}
        {cards.map((c) => {
          const seal = sealFor(c);
          const req = c.requestId ? me?.requests.find((r) => r.id === c.requestId) : undefined;
          return (
            <li key={c.id} className="card grid gap-3 p-5" data-testid="claim-card" data-state={seal ? "sealed" : req?.state ?? "self"}>
              <span className="label text-muted">{w.kinds[c.kind] ?? c.kind}</span>
              <p className="m-0 font-display text-3xl font-black uppercase leading-none">{c.title}</p>
              {c.org || c.from ? <p className="m-0 font-medium">{[c.org, [c.from, c.to].filter(Boolean).join(" to ")].filter(Boolean).join(", ")}</p> : null}
              <div className="flex flex-wrap items-center gap-2">
                {seal ? (
                  seal.revoked_at ? <StatusBadge tone="red" label={fill(w.cancelled, { org: seal.org_name })} /> : <StatusBadge tone="green" label={fill(w.sealed, { org: seal.org_name })} />
                ) : req?.state === "pending" ? (
                  <StatusBadge tone="yellow" label={fill(w.asked, { org: req.org_name })} />
                ) : req?.state === "declined" ? (
                  <StatusBadge tone="red" label={fill(w.declined, { org: req.org_name })} />
                ) : (
                  <span className="tag !bg-cream-2">{w.justWord}</span>
                )}
              </div>
              {!seal && req?.state !== "pending" ? (
                asking === c.id ? (
                  <div className="grid gap-3 rounded-[var(--r-md)] border-2 border-navy bg-cream p-3">
                    <label className="grid gap-1 font-bold">
                      {w.pick}
                      <select className="field" value={org} onChange={(e) => setOrg(e.target.value)} data-testid="org-pick">
                        <option value="">-</option>
                        {orgs.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="m-0 text-sm font-medium">{w.pickNone}</p>
                    <Button block disabled={!org} busy={busy} busyLabel={w.sending} onClick={() => ask(c)} data-testid="send-ask">
                      {fill(w.send, { org: orgs.find((o) => o.id === org)?.name ?? "..." })}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => { setAsking(c.id); setOrg(""); }} data-testid="ask">
                      <Icon name="mail" /> {w.ask}
                    </Button>
                    <Button tone="ghost" onClick={() => remove(c.id)} data-testid="remove">
                      {w.remove}
                    </Button>
                  </div>
                )
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button tone="cream" busy={refreshing} busyLabel={w.refresh} onClick={check} data-testid="refresh">
          {w.refresh}
        </Button>
        <p role="status" className="m-0 font-bold" data-testid="refresh-note">
          {note}
        </p>
      </div>

      <p className="m-0 font-medium">{w.deviceNote}</p>

      <details className="card p-5" data-testid="danger">
        <summary className="flex min-h-12 cursor-pointer items-center font-bold">{w.danger}</summary>
        <p className="mt-2 font-medium">{w.dangerBody}</p>
        {erasing ? (
          <Button tone="cream" busy={busy} onClick={erase} data-testid="erase-confirm">
            {w.dangerConfirm}
          </Button>
        ) : (
          <Button tone="ghost" onClick={() => setErasing(true)} data-testid="erase">
            {w.danger}
          </Button>
        )}
      </details>
    </div>
  );
}
