import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";
import { ResumeApp } from "@/components/wallet/resume-app";

export default async function Page() {
  const t = await getT();
  const c = t.site.resume;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} />
      <Shell width="max-w-3xl">
        <ResumeApp />
      </Shell>
    </>
  );
}
