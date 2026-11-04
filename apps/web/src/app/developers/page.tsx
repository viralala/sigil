import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";

export default async function Developers() {
  const t = await getT();
  const c = t.site.dev;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} />
      <Shell>
        <ul className="m-0 grid list-none gap-3 p-0">
          {c.items.map((i) => (
            <li key={i.path} className="card p-4">
              <code className="font-mono text-sm font-bold break-all">{i.path}</code>
              <p className="mt-1 mb-0 font-medium">{i.body}</p>
            </li>
          ))}
        </ul>
        <a className="btn btn-cream" href="https://github.com/viralala/sigil" target="_blank" rel="noopener noreferrer">
          {c.code}
        </a>
      </Shell>
    </>
  );
}
