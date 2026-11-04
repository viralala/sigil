import { getT } from "@/lib/i18n/server";
import { Curve, Doors, Enter, Hero, Ladder, Loader, Powers, Rail, Shaft, Statement, Stickers } from "@/components/f4/home";
import { F4Motion } from "@/components/f4/motion";

const TEAM = ["Viral Dhoka", "Tanaya Thorat", "Nayan Thakare", "Shreenath Utekar"];

export default async function Home() {
  const t = await getT();
  const h = t.site.home;
  return (
    <div className="f4">
      <Loader />
      <Hero t={h} />
      <Curve id="c-hero" d="M-40 40 C 300 170, 900 170, 1240 40" text={h.curve1} colour="var(--royal)" />
      <Statement t={h} />
      <Powers t={h} />
      <Curve id="c-powers" d="M-40 110 C 200 10, 400 10, 600 90 S 1000 170, 1240 70" text={h.curve2} colour="var(--flame)" direction={-1} />
      <Doors t={h} />
      <Rail t={h} tags={t.check.tags} />
      <Curve id="c-rail" d="M-40 150 C 300 10, 900 10, 1240 150" text={h.curve3} colour="var(--navy)" />
      <Shaft t={h} />
      <Enter t={h} />
      <Ladder t={h} team={TEAM} />
      <Curve id="c-ladder" d="M-40 60 C 250 160, 500 160, 640 90 S 1000 10, 1240 110" text={h.curve4} colour="var(--royal)" direction={-1} />
      <Stickers t={h} />
      <F4Motion />
    </div>
  );
}
