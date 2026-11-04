"use client";

import { useState } from "react";
import { fill } from "@/lib/i18n";
import { pdfFirstPage } from "@/lib/pdf";
import { api, ApiError, sha256Hex } from "@/lib/wallet/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { useI18n } from "@/components/site/i18n-provider";

type Hash = { match: boolean; orgName?: string; code?: string | null };
type Analysis = { level: "no_signs" | "some_signs" | "strong_signs"; signals: { id: string; plain: string }[]; modelVersion: string };

/** Paper check: fingerprint first (the file stays here), then a machine look for edits. Machines never go above "checked". */
export function PaperApp() {
  const { t } = useI18n();
  const p = t.site.paper;
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"" | "hash" | "scan">("");
  const [hash, setHash] = useState<Hash | null>(null);
  const [scan, setScan] = useState<Analysis | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!file) return;
    setError("");
    setHash(null);
    setScan(null);
    if (file.size > 4_000_000) return setError(p.tooBig);
    const pdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!pdf && !file.type.startsWith("image/")) return setError(p.notImage);
    setIsPdf(pdf);
    try {
      setStep("hash");
      const sha256 = await sha256Hex(file);
      const h = await api<Hash>("/api/paper/hash", { method: "POST", json: { sha256 } });
      setHash(h);
      setStep("scan");
      const image = pdf ? await pdfFirstPage(file) : file;
      if (image.size > 4_000_000) throw new ApiError("TOO_BIG");
      const res = await fetch("/api/paper/analyze", { method: "POST", headers: { "content-type": "application/octet-stream" }, body: image }).catch(() => {
        throw new ApiError("NETWORK");
      });
      const j = await res.json().catch(() => ({ error: "SERVER" }));
      if (!res.ok) throw new ApiError(j.error ?? "SERVER");
      setScan(j);
    } catch (e) {
      const code = (e as ApiError).code;
      setError(code === "NOT_IMAGE" ? p.notImage : code === "TOO_BIG" ? p.tooBig : p.errors[code] ?? p.notImage);
    } finally {
      setStep("");
    }
  }

  return (
    <div className="grid gap-5">
      <Card className="grid gap-4 p-5 sm:p-7">
        <label className="grid gap-2 font-display text-3xl font-black uppercase">
          {p.file}
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="field font-sans text-base font-medium normal-case"
            data-testid="paper-file"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setHash(null);
              setScan(null);
              setError("");
            }}
          />
        </label>
        <Button block disabled={!file} busy={Boolean(step)} busyLabel={step === "hash" ? p.running : p.scanning} onClick={run} data-testid="paper-run">
          <Icon name="check" /> {p.run}
        </Button>
        {error ? (
          <p role="alert" className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold" data-testid="paper-error">
            {error}
          </p>
        ) : null}
      </Card>

      {hash ? (
        <Card className="grid gap-2 p-5" data-testid="paper-hash" data-match={hash.match}>
          <div>
            <StatusBadge tone={hash.match ? "green" : "yellow"} label={hash.match ? fill(p.match, { org: hash.orgName }) : p.matchNo} />
          </div>
          <p className="m-0 text-lg font-medium">{hash.match ? fill(p.matchBody, { org: hash.orgName, code: hash.code ?? "-" }) : p.matchNoBody}</p>
          <p className="m-0 text-sm font-medium">{p.how}</p>
        </Card>
      ) : null}

      {scan ? (
        <Card className="grid gap-2 p-5" data-testid="paper-scan" data-level={scan.level}>
          <h2 className="text-3xl">{p.signsTitle}</h2>
          <div>
            {/* Finding nothing is not a witness, so it is never green. */}
            {scan.level === "no_signs" ? <span className="tag !bg-sky-2">{p.levels.no_signs}</span> : <StatusBadge tone="yellow" label={p.levels[scan.level]} />}
          </div>
          {scan.signals.length ? (
            <ul className="m-0 grid gap-1 pl-5">
              {scan.signals.map((s) => (
                <li key={s.id}>{s.plain}</li>
              ))}
            </ul>
          ) : null}
          <p className="m-0 font-medium">{p.caution}</p>
          <p className="m-0 text-sm font-medium">
            {p.upload} {isPdf ? p.pdfNote : ""}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
