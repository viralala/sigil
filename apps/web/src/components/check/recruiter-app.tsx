"use client";

import { useMemo, useState } from "react";
import { fill } from "@/lib/i18n";
import { parseShareLink } from "@/lib/link";
import { SAMPLE_BUTTONS } from "@/lib/samples";
import { api, ApiError } from "@/lib/wallet/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge, type Tone } from "@/components/ui/status-badge";
import { useI18n } from "@/components/site/i18n-provider";
import { checkShareLink, TIERS, whyOf, wordOf } from "./share-view";

type Row = { link: string; who: string; verdict: Tone; word: string; why: string };

/** Bulk check. Links are opened in this browser, so their keys never reach the server. */
export function RecruiterApp() {
  const { t } = useI18n();
  const r = t.site.recruiter;
  const v = t.site.view;
  const [text, setText] = useState("");
  const [tier, setTier] = useState("B");
  const [rows, setRows] = useState<Row[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | Tone>("all");
  const shown = useMemo(() => rows.filter((x) => filter === "all" || x.verdict === filter), [rows, filter]);

  async function one(line: string): Promise<Row> {
    const share = line.match(/\/s\/(sh_[a-z0-9]{16})#k=([\w-]+)/);
    try {
      if (share) {
        const { bundle, check } = await checkShareLink(share[1], share[2], tier);
        const why = check.results.flatMap((x) => whyOf(x, t)).join(" ");
        return { link: line, who: bundle.name ?? "-", verdict: check.verdict, word: t.result.verdict[check.verdict], why };
      }
      const parsed = parseShareLink(line);
      if (!parsed.ok) throw new ApiError("NOT_SIGIL");
      const c = await api<{ verdict: Tone; person: string; witness: unknown; reasons: string[]; warnings: string[]; custodian: string | null }>("/api/verify", { method: "POST", json: { link: line } });
      const why = [...c.reasons, ...c.warnings].map((k) => fill(t.result.reasons[k.split(":")[0]] ?? k, { custodian: c.custodian })).join(" ") || t.result.reasons.OK;
      return { link: line, who: c.person, verdict: c.verdict, word: wordOf(c, t), why };
    } catch (e) {
      const code = (e as ApiError).code;
      return { link: line, who: "-", verdict: "yellow", word: t.result.unverified, why: v.errors[code] ?? t.check.errors[code as "NOT_SIGIL"] ?? v.errors.SERVER };
    }
  }

  async function run() {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    setError("");
    if (!lines.length) return setError(r.empty);
    if (lines.length > 200) return setError(r.tooMany);
    setBusy(true);
    setRows([]);
    setDone(0);
    setTotal(lines.length);
    for (const l of lines) {
      const row = await one(l);
      setRows((x) => [...x, row]);
      setDone((d) => d + 1);
    }
    setBusy(false);
  }

  function download() {
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = ["link,person,result,why", ...rows.map((x) => [x.link.split("#")[0], x.who, x.word, x.why].map(q).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "sigil-check-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-5">
      <Card className="grid gap-4 p-5">
        <label className="grid gap-1 font-bold">
          {r.box}
          <textarea className="field min-h-40 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} data-testid="links" />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 font-bold">
            {r.strict}
            <select className="field" value={tier} onChange={(e) => setTier(e.target.value)}>
              {TIERS.map(([k, label]) => (
                <option key={k} value={k}>
                  {v[label]}
                </option>
              ))}
            </select>
          </label>
          <Button tone="cream" onClick={() => setText(SAMPLE_BUTTONS.map((b) => b.id).join("\n"))} data-testid="add-samples">
            {r.samples}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="bulk-error">
            {error}
          </p>
        ) : null}
        <Button block busy={busy} busyLabel={fill(r.running, { done, total })} onClick={run} data-testid="run">
          <Icon name="check" /> {r.run}
        </Button>
      </Card>

      {rows.length ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{r.filter}:</span>
            {(["all", "green", "yellow", "red"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`btn !min-h-12 !py-2 ${filter === k ? "btn-flame" : "btn-cream"}`} data-testid={`filter-${k}`}>
                {k === "all" ? r.all : t.result.verdict[k]} ({k === "all" ? rows.length : rows.filter((x) => x.verdict === k).length})
              </button>
            ))}
            <Button tone="cream" className="!min-h-12 !py-2 ml-auto" onClick={download} disabled={busy} data-testid="download">
              {r.download}
            </Button>
          </div>
          <ul className="m-0 grid list-none gap-3 p-0" data-testid="rows">
            {shown.map((x, i) => (
              <li key={i} className="card grid gap-1 p-4" data-testid="row" data-verdict={x.verdict}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b>{x.who}</b>
                  <StatusBadge tone={x.verdict} label={x.word} />
                </div>
                <p className="m-0 font-medium">{x.why}</p>
              </li>
            ))}
          </ul>
          {!shown.length ? <p className="m-0 font-bold">{r.noResults}</p> : null}
        </>
      ) : null}
    </div>
  );
}
