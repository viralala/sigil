// The landing page's three front doors. Ported from CESAC's power cards (f4/powers.tsx + f4.css .card):
// heavy navy outline, 6px offset shadow, one power colour each, original drawn glyphs.
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

export type Power = "flame" | "stretch" | "shield" | "rock";

const LOOK: Record<Power, string> = {
  flame: "tile-flame",
  stretch: "tile-stretch",
  shield: "tile-shield",
  rock: "tile-rock",
};

export function BigTile({
  href,
  title,
  body,
  cta,
  power,
  icon,
  className,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  power: Power;
  icon: IconName;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("big-tile", LOOK[power], className)}>
      <span className="big-tile-glyph" aria-hidden>
        <Icon name={icon} />
      </span>
      <span className="big-tile-title">{title}</span>
      <span className="big-tile-body">{body}</span>
      <span className="big-tile-cta" aria-hidden>
        {cta}
        <Icon name="arrow" />
      </span>
    </Link>
  );
}
