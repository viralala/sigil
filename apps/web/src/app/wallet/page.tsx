import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";
import { WalletApp } from "@/components/wallet/wallet-app";

export default async function Page() {
  const t = await getT();
  const c = t.site.wallet;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} ribbon={[t.site.nav.check, t.site.nav.wallet, t.site.nav.sign, t.site.nav.registry]} />
      <Shell width="max-w-3xl">
        <WalletApp />
      </Shell>
    </>
  );
}
