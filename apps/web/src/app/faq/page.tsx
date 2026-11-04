import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";

export default async function Faq() {
  const t = await getT();
  const c = t.site.faq;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} />
      <Shell>
        {c.items.map((q) => (
          <details key={q.q} className="card p-5" data-testid="faq">
            <summary className="flex min-h-12 cursor-pointer items-center text-xl font-bold">{q.q}</summary>
            <p className="mt-2 mb-0 text-lg font-medium">{q.a}</p>
          </details>
        ))}
      </Shell>
    </>
  );
}
