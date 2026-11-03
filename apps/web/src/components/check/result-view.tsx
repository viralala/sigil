"use client";

import type { CheckResult } from "@sigil/core";
import { fill, type Dict, type Locale } from "@/lib/i18n";
import { StatusBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { ReadAloud } from "@/components/site/read-aloud";
import { SampleTag } from "@/components/site/sample-tag";
import { useI18n } from "@/components/site/i18n-provider";

const DATE_LOCALE: Record<Locale, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

/** The verdict word. A yellow with no witness says "Not verified" (witness rule), never "fake". */
export function verdictWord(r: CheckResult, t: Dict) {
  return r.verdict === "yellow" && !r.witness ? t.result.unverified : t.result.verdict[r.verdict];
}

/** One plain sentence for the person checking. */
export function plainSentence(r: CheckResult, t: Dict) {
  const s = t.result.sentence;
  if (r.verdict === "red") return s.red;
  if (!r.witness) return s.noWitness;
  const vars = { ...r.claims, issuer: r.issuer.name };
  const tpl = s[r.kind as "degree" | "job" | "certificate"] ?? s.fallback;
  const out = fill(tpl, vars);
  return /\{\w+\}/.test(out) ? fill(s.fallback, vars) : out;
}

export function ResultView({ r, onAgain }: { r: CheckResult; onAgain: () => void }) {
  const { t, locale } = useI18n();
  const date = (iso: string) => new Intl.DateTimeFormat(DATE_LOCALE[locale], { dateStyle: "long" }).format(new Date(iso));
  const word = verdictWord(r, t);
  const sentence = plainSentence(r, t);
  const witnessLine = r.witness
    ? `${fill(t.result.witness[r.witness.how], { who: r.witness.who })} ${fill(t.result.witness.when, { date: date(r.witness.when) })}`
    : t.result.witness.none;
  const why = [
    ...r.reasons.map((c) => t.result.reasons[c.split(":")[0]] ?? c),
    ...r.warnings.map((c) => fill(t.result.reasons[c] ?? c, { custodian: r.custodian })),
    ...(r.reasons.length === 0 ? [t.result.reasons.OK] : []),
  ];
  const spoken = [word, sentence, witnessLine, ...why].join(". ");
  const tone = r.verdict;
  const soft = { green: "bg-ok-soft", yellow: "bg-warn-soft", red: "bg-bad-soft" }[tone];

  return (
    <section aria-labelledby="verdict" aria-live="polite" data-testid="result" data-verdict={r.verdict} className="grid gap-5">
      <Card className={`${soft} p-5 sm:p-8`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="verdict" className="m-0">
            <StatusBadge tone={tone} label={word} size="xl" />
          </h2>
          <SampleTag />
        </div>
        <p className="mt-5 mb-0 text-2xl font-bold leading-snug sm:text-3xl" data-testid="sentence">
          {sentence}
        </p>
        <p className="mt-3 mb-0 text-lg font-medium">{t.result.checkedNow}</p>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-3xl">
          <Icon name={r.witness ? "check" : "question"} /> {t.result.witness.title}
        </h3>
        <p className="mt-2 mb-0 text-lg font-medium" data-testid="witness">
          {witnessLine}
        </p>
        {r.warnings.includes("ISSUER_CLOSED") && r.custodian ? (
          <p className="mt-3 mb-0 rounded-[var(--r-sm)] border-2 border-navy bg-sky-2 p-3 font-medium">
            {fill(t.result.reasons.ISSUER_CLOSED, { custodian: r.custodian })}
          </p>
        ) : null}
      </Card>

      {Object.keys(r.claims).length > 0 ? (
        <Card className="p-5 sm:p-6">
          <h3 className="text-3xl">{t.result.claims}</h3>
          <ul className="mt-3 mb-0 grid list-none gap-2 p-0">
            {Object.entries(r.claims).map(([k, v]) => (
              <li key={k} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] py-2">
                <span className="label text-muted">{t.result.field[k] ?? k}</span>
                <span className="flex items-center gap-3 font-bold">
                  {String(v)}
                  <StatusBadge tone={tone} label={word} />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 mb-0 flex items-center gap-2 font-medium">
            <Icon name="lock" /> {fill(t.result.shown, { person: r.person, count: r.shownCount })}
          </p>
        </Card>
      ) : null}

      <details className="card group p-5 sm:p-6" data-testid="why">
        <summary className="flex min-h-12 cursor-pointer items-center gap-2 font-display text-3xl font-black uppercase">
          <Icon name="question" /> {t.result.why}
        </summary>
        <ul className="mt-3 mb-0 grid gap-2 pl-6 text-lg">
          {why.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </details>

      <details className="card p-5 sm:p-6" data-testid="nerds">
        <summary className="flex min-h-12 cursor-pointer items-center gap-2 font-display text-3xl font-black uppercase">
          <Icon name="code" /> {t.result.nerds}
        </summary>
        <dl className="mt-3 mb-0 grid gap-x-6 gap-y-2 font-mono text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-bold">{t.result.details.issuer}</dt>
          <dd className="m-0 break-all">{r.issuer.id}</dd>
          <dt className="font-bold">{t.result.details.tier}</dt>
          <dd className="m-0">{r.issuer.tier ?? "-"}</dd>
          <dt className="font-bold">{t.result.details.alg}</dt>
          <dd className="m-0">{r.details.alg}</dd>
          <dt className="font-bold">{t.result.details.kid}</dt>
          <dd className="m-0 break-all">{r.details.kid}</dd>
          <dt className="font-bold">{t.result.details.status}</dt>
          <dd className="m-0">{r.details.statusAgeMs == null ? "-" : `${Math.round(r.details.statusAgeMs / 1000)} s`}</dd>
          <dt className="font-bold">{t.result.details.trust}</dt>
          <dd className="m-0">{r.details.trustListVersion}</dd>
          <dt className="font-bold">{t.result.details.codes}</dt>
          <dd className="m-0 break-all">{[...r.reasons, ...r.warnings].join(", ") || "OK"}</dd>
        </dl>
      </details>

      <div className="flex flex-wrap gap-3">
        <ReadAloud text={spoken} />
        <button type="button" className="btn btn-flame" onClick={onAgain} data-testid="again">
          <Icon name="arrow" /> {t.check.again}
        </button>
      </div>
    </section>
  );
}
