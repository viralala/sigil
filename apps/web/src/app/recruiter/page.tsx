import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";
import { RecruiterApp } from "@/components/check/recruiter-app";

export default async function Page() {
  const t = await getT();
  const c = t.site.recruiter;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} />
      <Shell width="max-w-4xl">
        <RecruiterApp />
      </Shell>
    </>
  );
}
