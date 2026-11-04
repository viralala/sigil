"use client";

import { useCallback, useEffect, useState } from "react";
import { fill } from "@/lib/i18n";
import { api, ApiError } from "@/lib/wallet/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/components/site/i18n-provider";

type Req = { id: string; kind: string; fields: Record<string, string> };
type Seal = { id: string; kind: string; label: string | null; status_idx: number; created_at: string; revoked_at: string | null; revoke_reason: string | null; claimed: boolean };
type Queue = { org: { id: string; name: string; sample: boolean }; requests: Req[]; seals: Seal[] };
type Org = { slug: string; name: string; can_confirm: boolean; sample: boolean };
type Bulk = { issued: { line: number; ref: string | null; id: string; key: string }[]; bad: { line: number; problem: string }[] };

const DEMO_CODE = "DECCAN-DEMO-2026";

/** Minimal CSV: comma separated, optional double quotes. First line is the header. */
export function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const cells = (l: string) => [...l.matchAll(/("([^"]*)"|[^,]*)(,|$)/g)].slice(0, -1).map((m) => (m[2] ?? m[1]).trim());
  const head = cells(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((l) => {
    const c = cells(l);
    return Object.fromEntries(head.map((h, i) => [h, c[i] ?? ""]));
  });
}

export function SignApp() {
  const { t } = useI18n();
  const s = t.site.sign;
  const w = t.site.wallet;
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState("");
  const [q, setQ] = useState<Queue | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"queue" | "issued" | "bulk">("queue");
  const [csv, setCsv] = useState("name,title,year,ref\nPriya Nair,B.Tech Information Technology,2026,R-101\nRavi Kumar,B.Tech Computer Engineering,2026,R-102");
  const [bulk, setBulk] = useState<Bulk | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const fail = useCallback((e: unknown) => setError(s.errors[(e as ApiError).code] ?? s.errors.SERVER), [s.errors]);

  const load = useCallback(async () => {
    try {
      setQ(await api<Queue>("/api/issuer/queue"));
    } catch (e) {
      setQ(null);
      if ((e as ApiError).code !== "NOT_SIGNED_IN") fail(e);
    } finally {
      setReady(true);
    }
  }, [fail]);

  useEffect(() => {
    void load();
    api<{ orgs: Org[] }>("/api/orgs")
      .then((r) => setOrgs(r.orgs.filter((o) => o.can_confirm)))
      .catch(() => undefined);
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy("login");
    setError("");
    try {
      await api("/api/issuer/login", { method: "POST", json: { slug, code } });
      setCode("");
      await load();
    } catch (err) {
      setError((err as ApiError).code === "BAD_CODE" ? s.badCode : s.errors[(err as ApiError).code] ?? s.errors.SERVER);
    } finally {
      setBusy("");
    }
  }

  async function decide(id: string, decision: "yes" | "no") {
    setBusy(id + decision);
    setError("");
    setNote("");
    try {
      await api(`/api/issuer/requests/${id}`, { method: "POST", json: { decision } });
      setNote(decision === "yes" ? s.signed : s.refused);
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  }

  async function cancel(id: string) {
    setBusy(id);
    setError("");
    try {
      await api(`/api/issuer/seals/${id}`, { method: "POST", json: { reason: reasons[id] ?? "issued-in-error" } });
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  }

  async function runBulk() {
    setBusy("bulk");
    setError("");
    setBulk(null);
    try {
      setBulk(await api<Bulk>("/api/issuer/bulk", { method: "POST", json: { rows: parseCsv(csv) } }));
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  }

  function download() {
    const rows = ["line,ref,link", ...bulk!.issued.map((b) => `${b.line},${b.ref ?? ""},${location.origin}/wallet/claim/${b.id}#k=${b.key}`)];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    a.download = "sigil-claim-links.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function logout() {
    await api("/api/issuer/logout", { method: "POST" }).catch(() => undefined);
    setQ(null);
  }

  const banner = error ? (
    <p role="alert" className="m-0 flex items-center gap-2 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="sign-error">
      <Icon name="cross" /> {error}
    </p>
  ) : null;

  if (!ready)
    return (
      <p role="status" className="m-0 text-lg font-bold">
        {w.starting}
      </p>
    );

  if (!q)
    return (
      <Card className="p-5 sm:p-7">
        <form onSubmit={login} className="grid gap-4">
          {banner}
          <label className="grid gap-1 font-bold">
            {s.org}
            <select className="field" value={slug} onChange={(e) => setSlug(e.target.value)} required data-testid="org">
              <option value="">-</option>
              {orgs.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 font-bold">
            {s.code}
            <input className="field" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} required data-testid="code" />
          </label>
          <Button type="submit" block busy={busy === "login"} busyLabel={s.entering} data-testid="enter">
            {s.enter}
          </Button>
          <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-sm)] border-2 border-navy bg-cream p-3">
            <span className="tag sample-tag">{t.sample.badge}</span>
            <p className="m-0 flex-1 font-medium">{fill(s.demo, { code: DEMO_CODE })}</p>
            <Button
              tone="cream"
              onClick={() => {
                setSlug("deccan");
                setCode(DEMO_CODE);
              }}
              data-testid="use-demo"
            >
              {s.useDemo}
            </Button>
          </div>
        </form>
      </Card>
    );

  return (
    <div className="grid gap-5" data-testid="console">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 flex items-center gap-2 text-xl font-bold">
          {q.org.name} {q.org.sample ? <span className="tag sample-tag">{t.sample.badge}</span> : null}
        </p>
        <Button tone="ghost" onClick={logout} data-testid="sign-out">
          {s.out}
        </Button>
      </div>
      <div role="tablist" className="grid grid-cols-3 gap-2">
        {(["queue", "issued", "bulk"] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`btn ${tab === k ? "btn-flame" : "btn-cream"}`} data-testid={`tab-${k}`}>
            {s.tabs[k]} {k === "queue" ? `(${q.requests.length})` : k === "issued" ? `(${q.seals.length})` : ""}
          </button>
        ))}
      </div>
      {banner}
      {note ? (
        <p role="status" className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-ok-soft p-3 font-bold" data-testid="sign-note">
          {note}
        </p>
      ) : null}

      {tab === "queue" ? (
        <div className="grid gap-4">
          {q.requests.length === 0 ? (
            <Card className="p-6">
              <p className="m-0 text-lg font-bold">{s.queueEmpty}</p>
            </Card>
          ) : null}
          {q.requests.map((r) => (
            <Card key={r.id} className="grid gap-3 p-5" data-testid="request">
              <span className="label text-muted">{w.kinds[r.kind] ?? r.kind}</span>
              <p className="m-0 text-lg font-bold">{fill(s.claims, { name: r.fields.name })}</p>
              <p className="m-0 font-display text-3xl font-black uppercase leading-none">{r.fields.title}</p>
              {r.fields.from ? (
                <p className="m-0 font-medium">
                  {r.fields.from} to {r.fields.to ?? ""}
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <Button block busy={busy === r.id + "yes"} busyLabel={s.signing} onClick={() => decide(r.id, "yes")} data-testid="yes">
                  <Icon name="check" /> {s.yes}
                </Button>
                <Button tone="cream" block busy={busy === r.id + "no"} onClick={() => decide(r.id, "no")} data-testid="no">
                  <Icon name="cross" /> {s.no}
                </Button>
              </div>
            </Card>
          ))}
          <Button tone="cream" onClick={load} data-testid="queue-refresh">
            {s.refresh}
          </Button>
        </div>
      ) : null}

      {tab === "issued" ? (
        <div className="grid gap-3">
          {q.seals.length === 0 ? (
            <Card className="p-6">
              <p className="m-0 text-lg font-bold">{s.issuedEmpty}</p>
            </Card>
          ) : null}
          {q.seals.map((x) => (
            <Card key={x.id} className="grid gap-2 p-4" data-testid="issued">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">
                  {w.kinds[x.kind] ?? x.kind} · {x.label}
                </span>
                <span className="tag">{x.revoked_at ? s.cancelled : x.claimed ? s.claimed : s.unclaimed}</span>
              </div>
              {x.revoked_at ? (
                <p className="m-0 font-medium">{s.reasons[x.revoke_reason ?? ""] ?? ""}</p>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <label className="grid flex-1 gap-1 font-bold">
                    {s.why}
                    <select className="field" value={reasons[x.id] ?? "issued-in-error"} onChange={(e) => setReasons({ ...reasons, [x.id]: e.target.value })}>
                      {Object.entries(s.reasons).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button tone="cream" busy={busy === x.id} busyLabel={s.cancelling} onClick={() => cancel(x.id)} data-testid="cancel">
                    {s.cancel}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "bulk" ? (
        <Card className="grid gap-4 p-5">
          <p className="m-0 font-medium">{s.bulkLead}</p>
          <label className="grid gap-1 font-bold">
            {s.bulkBox}
            <textarea className="field min-h-40 font-mono text-sm" value={csv} onChange={(e) => setCsv(e.target.value)} data-testid="csv" />
          </label>
          <p className="m-0 font-bold" data-testid="bulk-preview">
            {fill(s.bulkPreview, { n: parseCsv(csv).length })}
          </p>
          <Button block busy={busy === "bulk"} busyLabel={s.bulkRunning} onClick={runBulk} data-testid="bulk-run">
            {s.bulkRun}
          </Button>
          {bulk ? (
            <div className="grid gap-2" data-testid="bulk-result">
              <p role="status" className="m-0 font-bold">
                {fill(s.bulkDone, { n: bulk.issued.length })}
              </p>
              {bulk.bad.map((b) => (
                <p key={b.line} className="m-0 font-medium" data-testid="bulk-bad">
                  {fill(s.bulkBad, { line: b.line, problem: b.problem })}
                </p>
              ))}
              {bulk.issued.length ? (
                <Button tone="cream" onClick={download} data-testid="bulk-download">
                  {s.download}
                </Button>
              ) : null}
              <ul className="sr-only" data-testid="bulk-links">
                {bulk.issued.map((b) => (
                  <li key={b.id}>{`/wallet/claim/${b.id}#k=${b.key}`}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
