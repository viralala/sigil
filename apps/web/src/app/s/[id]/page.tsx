import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { parseShareLink } from "@/lib/link";
import { PageHead, Shell } from "@/components/site/page-head";
import { ShareView } from "@/components/check/share-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id.startsWith("sh_")) {
    const parsed = parseShareLink(id);
    redirect(parsed.ok ? `/check?s=${parsed.id}` : "/check");
  }
  const t = await getT();
  return (
    <>
      <PageHead title={t.site.view.title} />
      <Shell>
        <ShareView id={id} />
      </Shell>
    </>
  );
}
