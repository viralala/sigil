import { cookies } from "next/headers";
import { getDict, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { BigTile } from "@/components/ui/big-tile";
import { Explainer } from "@/components/site/explainer";
import { Icon } from "@/components/ui/icon";

export default async function Home() {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = getDict(isLocale(v) ? v : "en");
  const tiles = t.home.tiles;

  return (
    <div className="wrap">
      <div className="mx-auto max-w-6xl">
        <section className="halftone-royal relative mt-6 overflow-hidden rounded-[var(--r-xl)] border-[3px] border-navy p-6 shadow-hard-3 sm:p-10">
          <span className="spark" style={{ top: "14%", right: "8%", ["--s" as string]: "34px", ["--c" as string]: "var(--ember)" }} />
          <span className="spark" style={{ bottom: "16%", right: "22%", ["--s" as string]: "18px", ["--d" as string]: "4s" }} />
          <p className="eyebrow m-0 text-cream">{t.home.eyebrow}</p>
          <h1 className="rise mt-4 max-w-[14ch] text-[clamp(52px,9vw,112px)] text-cream">{t.home.title}</h1>
          <p className="mt-5 max-w-[46ch] text-lg font-medium sm:text-xl">{t.home.lead}</p>
        </section>

        <h2 className="mt-12 mb-5 text-4xl sm:text-5xl">{t.home.pick}</h2>
        <nav aria-label={t.home.pick} className="grid gap-5 md:grid-cols-3">
          <BigTile href="/get-verified" power="stretch" icon="user" {...tiles.holder} />
          <BigTile href="/check" power="flame" icon="check" {...tiles.verifier} />
          <BigTile href="/sign" power="rock" icon="pen" {...tiles.issuer} />
        </nav>

        <div className="mt-12">
          <Explainer />
        </div>

        <section className="mt-12 grid items-start gap-4 sm:grid-cols-[auto_1fr]">
          <span className="grid h-16 w-16 place-items-center rounded-[var(--r-md)] border-2 border-navy bg-ember text-4xl shadow-hard-1">
            <Icon name="eye" />
          </span>
          <div>
            <h2 className="text-4xl">{t.home.honest.title}</h2>
            <p className="mt-3 max-w-[60ch] text-lg">{t.home.honest.body}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
