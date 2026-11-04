import { CheckApp } from "@/components/check/check-app";
import { parseShareLink } from "@/lib/link";
import { Shell } from "@/components/site/page-head";

export default async function CheckPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const parsed = parseShareLink(s);
  return (
    <div className="halftone pt-20">
      <Shell>
        <CheckApp initial={parsed.ok ? parsed.id : undefined} />
      </Shell>
    </div>
  );
}
