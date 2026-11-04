"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { timelineFlags } from "@sigil/parser";
import { fill, type Dict } from "@/lib/i18n";
import { openSecretBox } from "@/lib/sealbox";
import { api, ApiError, type Bundle } from "@/lib/wallet/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge, type Tone } from "@/components/ui/status-badge";
import { ReadAloud } from "@/components/site/read-aloud";
import { useI18n } from "@/components/site/i18n-provider";

export type ShareResult = {
  verdict: Tone;
  kind: string;
  claims: Record<string, string | number>;
  reasons: string[];
  warnings: string[];
  custodian: string | null;
  issuer: { id: string; name: string; state: string; tier: string; sample: boolean } | null;
  witness: { level: string; how: string; who: string; when: string } | null;
  details: { alg: string; kid: string; statusAgeMs: number | null; trustListVersion: number };
};
export type ShareCheck = { verdict: Tone; results: ShareResult[] };

export const TIERS = [
  ["C", "relaxed"],
  ["B", "normal"],
  ["A", "strictWord"],
] as const;

export function whyOf(r: ShareResult, t: Dict) {
  const reasons = t.result.reasons;
  return [
    ...r.reasons.map((c) => reasons[c.split(":")[0]] ?? c),
    ...r.warnings.map((c) => fill(reasons[c] ?? c, { custodian: r.custodian })),
    ...(r.reasons.length === 0 ? [reasons.OK] : []),
  ];
}

export function wordOf(r: { verdict: Tone; witness: unknown }, t: Dict) {
  return r.verdict === "yellow" && !r.witness ? t.result.unverified : t.result.verdict[r.verdict];
}

/** Fetches, decrypts and verifies one share link. Shared by the view page and the recruiter bulk check. */
export async function checkShareLink(id: string, key: string, minTier: string, repeat = false) {
  const { ciphertext } = await api<{ ciphertext: string }>(`/api/shares/${id}`);
  let bundle: Bundle;
  try {
    bundle = (await openSecretBox(ciphertext, key)) as Bundle;
  } catch {
    throw new ApiError("BAD_KEY");
  }
  const check = await api<ShareCheck>("/api/verify-share", { method: "POST", json: { shareId: id, presentations: bundle.presentations, minTier, repeat } });
  return { bundle, check };
}

export function ShareView({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const v = t.site.view;
  const [data, setData] = useState<{ bundle: Bundle; check: ShareCheck } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [tier, setTier] = useState("B");
  const first = useRef(true);
  const date = (d: string) => new Intl.DateTimeFormat(`${locale}-IN`, { dateStyle: "long" }).format(new Date(d));

  const run = useCallback(
    async (minTier: string) => {
      setBusy(true);
      setError("");
      const key = new URLSearchParams(location.hash.slice(1)).get("k");
      try {
        if (!key) throw new ApiError("BAD_KEY");
        setData(await checkShareLink(id, key, minTier, !first.current));
        first.current = false;
      } catch (e) {
        setData(null);
        setError(v.errors[(e as ApiError).code] ?? v.errors.SERVER);
      } finally {
        setBusy(false);
      }
    },
    [id, v.errors],
  );

  useEffect(() => {
    void run("B");
  }, [run]);

  if (error)
    return (
      <p role="alert" className="card m-0 flex items-center gap-2 p-5 text-lg font-bold" data-testid="view-error">
        <Icon name="cross" /> {error}
      </p>
    );
  if (!data)
    return (
      <p role="status" className="m-0 text-lg font-bold" data-testid="view-loading">
        {v.loading}
      </p>
    );

  const { bundle, check } = data;
  const count = (x: Tone) => check.results.filter((r) => r.verdict === x).length;
  const summary = fill(v.summary, { ok: count("green"), look: count("yellow"), bad: count("red"), word: bundle.self.length });
  const flags = timelineFlags(
    [...check.results.map((r) => ({ kind: r.kind, title: String(r.claims.title ?? ""), from: r.claims.from ? String(r.claims.from) : null, to: r.claims.to ? String(r.claims.to) : null })), ...bundle.self].map((c, i) => ({
      id: String(i),
      org: null,
      confidence: 1,
      source: "",
      ...c,
    })) as Parameters<typeof timelineFlags>[0],
  );
  const word = check.results.length ? t.result.verdict[check.verdict] : t.result.unverified;

  return (
    <div className="grid gap-5" data-testid="share-view" data-verdict={check.verdict}>
      <Card className="p-5 sm:p-7">
        <h2 className="m-0">
          <StatusBadge tone={check.verdict} label={word} size="xl" />
        </h2>
        {bundle.name ? (
          <p className="mt-4 mb-0 text-2xl font-bold" data-testid="view-name">
            {fill(v.of, { name: bundle.name })}
          </p>
        ) : null}
        <p className="mt-2 mb-0 text-lg font-bold" data-testid="view-summary">
          {summary}
        </p>
      </Card>

      <label className="flex flex-wrap items-center gap-3 font-bold">
        {v.strict}
        <select
          className="field !w-auto"
          value={tier}
          disabled={busy}
          data-testid="strict"
          onChange={(e) => {
            setTier(e.target.value);
            void run(e.target.value);
          }}
        >
          {TIERS.map(([k, label]) => (
            <option key={k} value={k}>
              {v[label]}
            </option>
          ))}
        </select>
      </label>

      {flags.map((f) => (
        <p key={`${f.a}${f.b}`} className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-warn-soft p-3 font-bold">
          {fill(v.timeline, { a: f.a, b: f.b ?? "" })}
        </p>
      ))}

      <ul className="m-0 grid list-none gap-4 p-0">
        {check.results.map((r, i) => (
          <li key={i} className="card grid gap-2 p-5" data-testid="view-claim" data-verdict={r.verdict}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge tone={r.verdict} label={wordOf(r, t)} />
              {r.issuer?.sample ? <span className="tag sample-tag">{t.sample.badge}</span> : null}
            </div>
            {Object.keys(r.claims).length ? (
              <dl className="m-0 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
                {Object.entries(r.claims).map(([k, val]) => (
                  <div key={k} className="contents">
                    <dt className="label text-muted">{t.result.field[k] ?? k}</dt>
                    <dd className="m-0 font-bold">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p className="m-0 font-medium" data-testid="view-witness">
              {r.witness ? `${fill(t.result.witness[r.witness.how as "signed"], { who: r.witness.who })} ${fill(t.result.witness.when, { date: date(r.witness.when) })}` : t.result.witness.none}
            </p>
            <details>
              <summary className="flex min-h-12 cursor-pointer items-center gap-2 font-bold">
                <Icon name="question" /> {t.result.why}
              </summary>
              <ul className="m-0 grid gap-1 pl-5">
                {whyOf(r, t).map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <p className="mt-2 mb-0 font-mono text-xs break-all">
                {r.details.alg} · {r.details.kid} · {[...r.reasons, ...r.warnings].join(", ") || "OK"}
              </p>
            </details>
          </li>
        ))}
      </ul>

      {bundle.self.length ? (
        <Card className="grid gap-2 p-5">
          <h3 className="text-3xl">{v.selfTitle}</h3>
          <p className="m-0 font-medium">{v.selfNote}</p>
          <ul className="m-0 grid gap-1 pl-5">
            {bundle.self.map((c) => (
              <li key={c.title} data-testid="view-self">
                {c.title}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <ReadAloud text={`${word}. ${bundle.name ?? ""}. ${summary}`} />
    </div>
  );
}
