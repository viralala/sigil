import Link from "next/link";
import { cookies, headers } from "next/headers";
import QRCode from "qrcode";
import { getDict, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { CopyLink } from "@/components/site/copy-link";
import { SigilLogo } from "@/components/site/sigil-logo";

const SAMPLE_ID = "asha-degree";

export default async function GetVerified() {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = getDict(isLocale(v) ? v : "en");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/s/${SAMPLE_ID}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: "#0B2350", light: "#FFFDF8" } });

  return (
    <div className="wrap py-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <div>
          <h1 className="text-5xl sm:text-7xl">{t.holder.title}</h1>
          <p className="mt-3 mb-0 text-xl font-medium">{t.holder.lead}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="halftone-royal relative overflow-hidden rounded-[var(--r-card)] border-2 border-navy p-6 shadow-hard-2" data-testid="seal">
            <span className="tag sample-tag absolute top-4 right-4">{t.sample.badge}</span>
            <SigilLogo className="h-16 w-16" />
            <p className="mt-6 mb-0 font-display text-5xl font-black uppercase leading-none">{t.holder.sealTitle}</p>
            <p className="mt-2 mb-0 text-lg font-bold">{t.holder.sealLine}</p>
            <p className="mt-4 mb-0 font-medium">{t.holder.sealBy}</p>
            <div className="mt-5">
              <StatusBadge tone="green" label={t.result.verdict.green} />
            </div>
          </div>

          <Card className="grid gap-4 p-6">
            <h2 className="text-4xl">{t.holder.shareTitle}</h2>
            <p className="m-0 font-medium">{t.holder.shareBody}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated on the server */}
            <img src={qr} alt={t.holder.qrAlt} width={220} height={220} className="rounded-[var(--r-sm)] border-2 border-navy" />
            <p className="m-0 break-all font-mono text-sm" data-testid="share-url">
              {url}
            </p>
            <CopyLink url={url} />
            <Link href={`/check?s=${SAMPLE_ID}`} className="btn btn-flame w-full" data-testid="try-seal">
              <Icon name="check" /> {t.holder.tryIt}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
