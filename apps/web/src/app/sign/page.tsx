import { cookies } from "next/headers";
import { getDict, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { ConfirmCard } from "@/components/sign/confirm-card";

export default async function SignPage() {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = getDict(isLocale(v) ? v : "en");
  return (
    <div className="wrap py-8">
      <div className="mx-auto grid max-w-3xl gap-6">
        <div>
          <h1 className="text-5xl sm:text-7xl">{t.issuer.title}</h1>
          <p className="mt-3 mb-0 text-xl font-medium">{t.issuer.lead}</p>
        </div>
        <ConfirmCard />
      </div>
    </div>
  );
}
