import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";

export default async function NotFound() {
  const t = await getT();
  const c = t.site.notFound;
  return (
    <>
      <PageHead title={c.title} lede={c.body} />
      <Shell>
        <Link href="/" className="btn btn-flame">
          {c.cta}
        </Link>
      </Shell>
    </>
  );
}
