import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";

export default async function Privacy() {
  const t = await getT();
  const c = t.site.privacy;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} />
      <Shell>
        {c.blocks.map((b) => (
          <section key={b.h} className="card p-5 sm:p-6">
            <h2 className="text-3xl">{b.h}</h2>
            <p className="mt-2 mb-0 text-lg font-medium">{b.p}</p>
          </section>
        ))}
      </Shell>
    </>
  );
}
