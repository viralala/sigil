import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";
import { ActivityApp } from "@/components/wallet/activity-app";

export default async function Page() {
  const t = await getT();
  const c = t.site.activity;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} />
      <Shell width="max-w-3xl">
        <ActivityApp />
      </Shell>
    </>
  );
}
