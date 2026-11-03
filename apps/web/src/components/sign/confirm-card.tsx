"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { fill } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SampleTag } from "@/components/site/sample-tag";
import { useI18n } from "@/components/site/i18n-provider";

type State = { s: "ask" } | { s: "busy" } | { s: "done"; id: string } | { s: "declined" } | { s: "error"; code: string };

/** The registrar's one-tap confirm (W3 flow, UX_SPEC I2). "Yes" really signs a sample Seal. */
export function ConfirmCard() {
  const { t } = useI18n();
  const [name, setName] = useState("Priya Nair");
  const [degree, setDegree] = useState("B.Tech Information Technology");
  const [year, setYear] = useState("2026");
  const [state, setState] = useState<State>({ s: "ask" });
  const status = useRef<HTMLDivElement>(null);

  async function yes() {
    setState({ s: "busy" });
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, degree, year: Number(year) }),
      });
      const j = await res.json().catch(() => ({ error: "SERVER" }));
      setState(res.ok ? { s: "done", id: j.id } : { s: "error", code: j.error ?? "SERVER" });
    } catch {
      setState({ s: "error", code: "NETWORK" });
    }
    requestAnimationFrame(() => status.current?.focus());
  }

  const busy = state.s === "busy";
  const finished = state.s === "done" || state.s === "declined";

  return (
    <Card className="grid gap-5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label m-0 flex items-center gap-2">
          <Icon name="mail" className="text-lg" /> {t.issuer.mail}
        </p>
        <SampleTag />
      </div>
      <div className="font-mono text-sm">
        <p className="m-0">{t.issuer.from}</p>
        <p className="m-0">{t.issuer.to}</p>
      </div>

      <fieldset disabled={busy || finished} className="m-0 grid gap-3 border-0 p-0 sm:grid-cols-3">
        <label className="grid gap-1 font-bold">
          {t.issuer.name}
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} data-testid="f-name" />
        </label>
        <label className="grid gap-1 font-bold">
          {t.issuer.degree}
          <input className="field" value={degree} onChange={(e) => setDegree(e.target.value)} maxLength={80} />
        </label>
        <label className="grid gap-1 font-bold">
          {t.issuer.year}
          <input className="field" value={year} inputMode="numeric" onChange={(e) => setYear(e.target.value)} maxLength={4} data-testid="f-year" />
        </label>
      </fieldset>

      <p className="m-0 rounded-[var(--r-md)] border-2 border-navy bg-cream p-4 text-xl font-bold">
        {fill(t.issuer.ask, { name: name || "...", degree: degree || "...", year: year || "..." })}
      </p>

      <div ref={status} tabIndex={-1} className="outline-none">
        {state.s === "done" ? (
          <div role="status" className="grid gap-3" data-testid="confirm-done">
            <p className="m-0 flex items-center gap-2 rounded-[var(--r-sm)] border-2 border-navy bg-ok-soft p-3 text-lg font-bold">
              <Icon name="check" /> {fill(t.issuer.done, { name })}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href={`/check?s=${state.id}`} className="btn btn-flame" data-testid="check-new">
                <Icon name="check" /> {t.issuer.checkIt}
              </Link>
              <Button tone="cream" onClick={() => setState({ s: "ask" })}>
                {t.issuer.reset}
              </Button>
            </div>
          </div>
        ) : state.s === "declined" ? (
          <div role="status" className="grid gap-3" data-testid="confirm-declined">
            <p className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-sky-2 p-3 text-lg font-bold">{t.issuer.declined}</p>
            <Button tone="cream" onClick={() => setState({ s: "ask" })}>
              {t.issuer.reset}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {state.s === "error" ? (
              <p role="alert" className="m-0 flex items-center gap-2 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="confirm-error">
                <Icon name="cross" /> {t.issuer.errors[state.code] ?? t.issuer.errors.SERVER}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <Button block busy={busy} busyLabel={t.issuer.signing} onClick={yes} data-testid="confirm-yes">
                <Icon name="check" /> {t.issuer.yes}
              </Button>
              <Button tone="cream" block disabled={busy} onClick={() => setState({ s: "declined" })} data-testid="confirm-no">
                <Icon name="cross" /> {t.issuer.no}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
