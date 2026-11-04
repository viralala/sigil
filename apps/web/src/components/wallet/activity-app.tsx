"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fill } from "@/lib/i18n";
import { api, ApiError, sync, type Me } from "@/lib/wallet/client";
import { Button } from "@/components/ui/button";
import { Card as Box } from "@/components/ui/card";
import { useI18n } from "@/components/site/i18n-provider";

export function ActivityApp() {
  const { t, locale } = useI18n();
  const a = t.site.activity;
  const s = t.site.share;
  const w = t.site.wallet;
  const [shares, setShares] = useState<Me["shares"] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const date = (d: string) => new Intl.DateTimeFormat(`${locale}-IN`, { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

  useEffect(() => {
    sync()
      .then(({ me }) => setShares(me.shares))
      .catch((e: ApiError) => setError(w.errors[e.code] ?? w.errors.SERVER));
  }, [w.errors]);

  async function stop(id: string) {
    setBusy(id);
    setError("");
    try {
      await api(`/api/shares/${id}`, { method: "DELETE" });
      setShares((all) => all!.map((x) => (x.id === id ? { ...x, stopped_at: new Date().toISOString() } : x)));
    } catch (e) {
      setError(w.errors[(e as ApiError).code] ?? w.errors.SERVER);
    } finally {
      setBusy("");
    }
  }

  if (error)
    return (
      <p role="alert" className="m-0 rounded-[var(--r-sm)] border-2 border-navy bg-bad-soft p-3 font-bold">
        {error}
      </p>
    );
  if (!shares)
    return (
      <p role="status" className="m-0 text-lg font-bold">
        {w.starting}
      </p>
    );
  if (!shares.length)
    return (
      <Box className="grid gap-4 p-6">
        <p className="m-0 text-lg font-bold">{a.noLinks}</p>
        <Link href="/wallet/share" className="btn btn-flame">
          {a.makeLink}
        </Link>
      </Box>
    );

  return (
    <ul className="m-0 grid list-none gap-4 p-0" data-testid="activity">
      {shares.map((x) => {
        const dead = x.stopped_at ? s.stopped : new Date(x.expires_at) < new Date() ? s.expired : null;
        return (
          <li key={x.id} className="card grid gap-2 p-5" data-testid="share-row">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="tag">{dead ?? fill(s.active, { date: date(x.expires_at) })}</span>
              <span className="font-bold" data-testid="view-count">
                {fill(a.views, { n: x.receipts.length })}
              </span>
            </div>
            <p className="m-0 font-medium">{fill(a.shown, { list: x.shown.map((k) => (k === "self" ? s.selfNote : t.result.field[k] ?? k)).join(", ") })}</p>
            {x.receipts.length ? (
              <ul className="m-0 grid gap-1 pl-5">
                {x.receipts.slice(0, 5).map((r) => (
                  <li key={r.at}>{fill(a.viewed, { date: date(r.at), verdict: t.result.verdict[r.verdict as "green"] })}</li>
                ))}
              </ul>
            ) : (
              <p className="m-0 font-medium">{a.none}</p>
            )}
            {!dead ? (
              <Button tone="cream" busy={busy === x.id} onClick={() => stop(x.id)} data-testid="stop-share">
                {s.stop}
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
