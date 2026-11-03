import Link from "next/link";
import { cookies } from "next/headers";
import { getDict, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

// Shown by the service worker when there is no network and the page was never cached.
export default async function Offline() {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = getDict(isLocale(v) ? v : "en");
  return (
    <div className="wrap py-10">
      <Card className="mx-auto grid max-w-xl gap-4 p-6">
        <h1 className="text-5xl">{t.offline.title}</h1>
        <p className="m-0 text-lg font-medium">{t.offline.body}</p>
        <Link href="/check" className="btn btn-flame">
          {t.offline.retry}
        </Link>
      </Card>
    </div>
  );
}
