"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { parseResume, timelineFlags } from "@sigil/parser";
import { fill } from "@/lib/i18n";
import { kvGet, kvSet, type Card } from "@/lib/wallet/client";
import { pdfText } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Card as Box } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/components/site/i18n-provider";

type Claim = ReturnType<typeof parseResume>["claims"][number];
const KINDS = ["education", "job", "certificate", "skill", "publication", "patent", "award", "event", "other"];

/** Reads the resume on this device. The software proposes cards; the holder edits and keeps them. */
export function ResumeApp() {
  const { t } = useI18n();
  const r = t.site.resume;
  const w = t.site.wallet;
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState<Claim[] | null>(null);
  const [saving, setSaving] = useState(false);
  const flags = useMemo(() => (found ? timelineFlags(found) : []), [found]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError("");
    if (f.size > 5_000_000) return setError(r.tooBig);
    setBusy(true);
    try {
      setText(f.type === "application/pdf" || f.name.endsWith(".pdf") ? await pdfText(f) : await f.text());
    } catch {
      setError(r.badFile);
    } finally {
      setBusy(false);
    }
  }

  function read() {
    setError("");
    try {
      const { claims } = parseResume(text);
      if (!claims.length) return setError(r.none);
      setFound(claims);
    } catch {
      setError(r.badFile);
    }
  }

  const edit = (id: string, patch: Partial<Claim>) => setFound((c) => c!.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  async function keep() {
    setSaving(true);
    const have = (await kvGet<Card[]>("cards")) ?? [];
    const next: Card[] = found!.filter((c) => c.title.trim()).map((c) => ({ id: crypto.randomUUID(), kind: c.kind, title: c.title.trim(), org: c.org, from: c.from, to: c.to }));
    await kvSet("cards", [...have, ...next]);
    router.push("/wallet");
  }

  if (found)
    return (
      <div className="grid gap-5" data-testid="found">
        <p role="status" className="m-0 text-xl font-bold">
          {fill(r.found, { count: found.length })}
        </p>
        <p className="m-0 flex items-center gap-2 font-medium">
          <Icon name="question" /> {r.aiNote}
        </p>
        {flags.map((f) => (
          <p key={`${f.a}${f.b}`} className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-warn-soft p-3 font-bold" data-testid="overlap">
            {fill(r.overlap, { a: f.a, b: f.b ?? "" })}
          </p>
        ))}
        <ul className="m-0 grid list-none gap-4 p-0">
          {found.map((c) => (
            <li key={c.id} className="card grid gap-3 p-4" data-testid="found-card">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="grid gap-1 font-bold">
                  {r.title2}
                  <input className="field" value={c.title} onChange={(e) => edit(c.id, { title: e.target.value })} maxLength={120} />
                </label>
                <label className="grid gap-1 font-bold">
                  {r.kind}
                  <select className="field" value={c.kind} onChange={(e) => edit(c.id, { kind: e.target.value as Claim["kind"] })}>
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {w.kinds[k]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{[c.org, c.from && `${c.from} to ${c.to ?? ""}`].filter(Boolean).join(", ")}</span>
                <Button tone="ghost" onClick={() => setFound((x) => x!.filter((y) => y.id !== c.id))}>
                  {w.remove}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <Button block busy={saving} onClick={keep} data-testid="keep">
          <Icon name="check" /> {r.keep}
        </Button>
      </div>
    );

  return (
    <Box className="grid gap-4 p-5 sm:p-7">
      {error ? (
        <p role="alert" className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="resume-error">
          {error}
        </p>
      ) : null}
      <label className="grid gap-2 font-display text-3xl font-black uppercase">
        {r.file}
        <input type="file" accept=".pdf,.txt,text/plain,application/pdf" className="field font-sans text-base font-medium normal-case" onChange={(e) => onFile(e.target.files?.[0])} data-testid="resume-file" />
      </label>
      <label className="grid gap-2 font-bold">
        {r.paste}
        <textarea className="field min-h-56 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} maxLength={200000} data-testid="resume-text" />
      </label>
      <Button block busy={busy} busyLabel={r.reading} disabled={!text.trim()} onClick={read} data-testid="read">
        <Icon name="eye" /> {r.read}
      </Button>
      <Link href="/wallet" className="font-bold text-navy">
        {t.site.wallet.title}
      </Link>
    </Box>
  );
}
