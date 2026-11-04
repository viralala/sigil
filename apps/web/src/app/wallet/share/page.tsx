import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";
import { ShareApp } from "@/components/wallet/share-app";

export default async function Page() {
  const t = await getT();
  const c = t.site.share;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} />
      <Shell width="max-w-3xl">
        <ShareApp />
      </Shell>
    </>
  );
}
