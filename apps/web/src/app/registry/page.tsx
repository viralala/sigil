import { getT } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { db } from "@/lib/server/db";
import { PageHead, Shell } from "@/components/site/page-head";

export const dynamic = "force-dynamic";

type Org = { id: string; name: string; kind: string; tier: string; state: string; state_since: Date | null; custodian: string | null; sample: boolean };

export default async function Registry() {
  const t = await getT();
  const r = t.site.registry;
  const orgs = await db()<Org[]>`select id, name, kind, tier, state, state_since, custodian, sample from orgs order by sample, name`;
  return (
    <>
      <PageHead title={r.title} lede={r.lead} />
      <Shell width="max-w-4xl">
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2" data-testid="registry">
          {orgs.map((o) => (
            <li key={o.id} className="card grid gap-2 p-5" data-testid="org-row" data-state={o.state}>
              <div className="flex flex-wrap gap-2">
                <span className="tag !bg-sky-2">{r.kinds[o.kind] ?? o.kind}</span>
                <span className="tag">{r.states[o.state] ?? o.state}</span>
                {o.sample ? <span className="tag sample-tag">{t.sample.badge}</span> : null}
              </div>
              <p className="m-0 font-display text-3xl font-black uppercase leading-none">{o.name}</p>
              <p className="m-0 font-medium">{fill(r.level, { tier: o.tier })}</p>
              {o.state_since ? <p className="m-0 font-medium">{fill(r.since, { date: o.state_since.toISOString().slice(0, 10) })}</p> : null}
              {o.custodian ? <p className="m-0 font-medium">{fill(r.keeper, { name: o.custodian })}</p> : null}
              <p className="m-0 font-mono text-xs break-all">{o.id}</p>
            </li>
          ))}
        </ul>
        <a className="btn btn-cream" href="/.well-known/sigil-trust.json" data-testid="raw-list">
          {r.raw}
        </a>
      </Shell>
    </>
  );
}
