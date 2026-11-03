"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CheckResult } from "@sigil/core";
import { parseShareLink } from "@/lib/link";
import { SAMPLE_BUTTONS } from "@/lib/samples";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { SampleTag } from "@/components/site/sample-tag";
import { useI18n } from "@/components/site/i18n-provider";
import dynamic from "next/dynamic";
import type { ScanError } from "./qr-scanner";
import { ResultView } from "./result-view";

// The QR decoder is only downloaded when someone taps "Scan a QR code".
const QrScanner = dynamic(() => import("./qr-scanner").then((m) => m.QrScanner), { ssr: false });

type ErrorCode = keyof ReturnType<typeof useI18n>["t"]["check"]["errors"];
type State =
  | { s: "idle" }
  | { s: "scanning" }
  | { s: "loading" }
  | { s: "error"; code: ErrorCode }
  | { s: "done"; r: CheckResult };

export function CheckApp({ initial }: { initial?: string }) {
  const { t } = useI18n();
  const [link, setLink] = useState(initial ?? "");
  const [state, setState] = useState<State>({ s: "idle" });
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const run = useCallback(async (value: string) => {
    const parsed = parseShareLink(value);
    if (!parsed.ok) {
      setState({ s: "error", code: parsed.error });
      input.current?.focus();
      return;
    }
    setState({ s: "loading" });
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ link: value }),
      });
      const j = await res.json().catch(() => ({ error: "SERVER" }));
      if (!res.ok) {
        const code = (j.error in t.check.errors ? j.error : "SERVER") as ErrorCode;
        setState({ s: "error", code });
        return;
      }
      setState({ s: "done", r: j as CheckResult });
    } catch {
      setState({ s: "error", code: "NETWORK" });
    }
  }, [t.check.errors]);

  // A scanned /s/<id> link lands here with ?s=<id>: check it straight away.
  useEffect(() => {
    if (initial) void run(initial);
  }, [initial, run]);

  useEffect(() => {
    if (state.s === "done") heading.current?.focus();
  }, [state.s]);

  const onScan = useCallback(
    (text: string) => {
      setLink(text);
      void run(text);
    },
    [run],
  );
  const onScanError = useCallback((code: ScanError) => setState({ s: "error", code }), []);

  function again() {
    setLink("");
    setState({ s: "idle" });
    window.history.replaceState(null, "", "/check");
    requestAnimationFrame(() => input.current?.focus());
  }

  if (state.s === "done") {
    return (
      <div className="grid gap-4">
        <h1 ref={heading} tabIndex={-1} className="text-5xl outline-none sm:text-6xl">
          {t.check.title}
        </h1>
        <ResultView r={state.r} onAgain={again} />
      </div>
    );
  }

  const busy = state.s === "loading";
  const passing = SAMPLE_BUTTONS.filter((b) => b.group === "pass");
  const attacks = SAMPLE_BUTTONS.filter((b) => b.group === "attack");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-5xl sm:text-7xl">{t.check.title}</h1>
        <p className="mt-3 mb-0 text-xl font-medium">{t.check.lead}</p>
      </div>

      <Card className="p-5 sm:p-7">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void run(link);
          }}
          className="grid gap-4"
        >
          <label htmlFor="link" className="font-display text-3xl font-black uppercase">
            {t.check.label}
          </label>
          <input
            ref={input}
            id="link"
            name="link"
            className="field text-lg"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder={t.check.placeholder}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            aria-invalid={state.s === "error" || undefined}
            aria-describedby={state.s === "error" ? "check-error" : undefined}
            disabled={busy}
          />
          {state.s === "error" ? (
            <p id="check-error" role="alert" className="m-0 flex items-center gap-2 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="check-error">
              <Icon name="cross" /> {t.check.errors[state.code]}
            </p>
          ) : null}
          {busy ? (
            <p role="status" className="m-0 font-bold" data-testid="check-loading">
              {t.check.loading}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="submit" block busy={busy} busyLabel={t.check.loading} data-testid="check-submit">
              <Icon name="check" /> {t.check.submit}
            </Button>
            <Button
              tone="cream"
              block
              disabled={busy}
              onClick={() => setState(state.s === "scanning" ? { s: "idle" } : { s: "scanning" })}
              aria-pressed={state.s === "scanning"}
              data-testid="scan"
            >
              <Icon name={state.s === "scanning" ? "stop" : "camera"} />
              {state.s === "scanning" ? t.check.stopScan : t.check.scan}
            </Button>
          </div>
        </form>
        {state.s === "scanning" ? (
          <div className="mt-5">
            <QrScanner hint={t.check.scanHint} onResult={onScan} onError={onScanError} />
          </div>
        ) : null}
      </Card>

      <section aria-labelledby="samples" className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="samples" className="text-4xl">
            {t.check.samplesTitle}
          </h2>
          <SampleTag />
        </div>
        {[
          { title: t.check.samplesPass, list: passing },
          { title: t.check.samplesAttack, list: attacks },
        ].map((g) => (
          <div key={g.title}>
            <h3 className="label mb-3 text-muted">{g.title}</h3>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {g.list.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="btn btn-cream w-full !justify-between text-left"
                    disabled={busy}
                    data-sample={b.id}
                    onClick={() => {
                      setLink(b.id);
                      void run(b.id);
                    }}
                  >
                    <span>{b.person}</span>
                    <span className="flex flex-wrap justify-end gap-1">
                      {b.tags.map((tag) => (
                        <span key={tag} className="tag !bg-sky-2">
                          {t.check.tags[tag]}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
