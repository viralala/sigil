import { CheckApp } from "@/components/check/check-app";
import { parseShareLink } from "@/lib/link";

export default async function CheckPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const parsed = parseShareLink(s);
  return (
    <div className="wrap py-8">
      <div className="mx-auto max-w-3xl">
        <CheckApp initial={parsed.ok ? parsed.id : undefined} />
      </div>
    </div>
  );
}
