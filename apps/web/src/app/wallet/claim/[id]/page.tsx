import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";
import { ClaimApp } from "@/components/wallet/claim-app";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();
  return (
    <>
      <PageHead title={t.site.claim.title} />
      <Shell>
        <ClaimApp id={id} />
      </Shell>
    </>
  );
}
