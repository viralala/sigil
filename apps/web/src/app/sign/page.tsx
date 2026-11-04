import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";
import { SignApp } from "@/components/sign/sign-app";

export default async function Page() {
  const t = await getT();
  const c = t.site.sign;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} ribbon={[t.site.nav.check, t.site.nav.wallet, t.site.nav.sign, t.site.nav.registry]} />
      <Shell width="max-w-3xl">
        <SignApp />
      </Shell>
    </>
  );
}
