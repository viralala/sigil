import type { ReactNode } from "react";
import { Ribbon } from "./ribbon";

// The top of an interior page (CESAC sections/page-head.tsx): halftone ground, big title, running ribbon.
export function PageHead({ kicker, title, lede, ribbon }: { kicker?: string; title: ReactNode; lede?: string; ribbon?: readonly string[] }) {
  return (
    <header className="halftone relative overflow-hidden border-b-2 border-navy pt-28 pb-10 sm:pt-32">
      <div className="wrap">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6">
          <div>
            {kicker ? <p className="eyebrow m-0 mb-3 text-navy">{kicker}</p> : null}
            <h1 className="text-[clamp(2.8rem,9vw,5.5rem)] text-navy">{title}</h1>
          </div>
          {lede ? <p className="m-0 max-w-[44ch] text-lg font-medium">{lede}</p> : null}
        </div>
      </div>
      {ribbon ? <Ribbon items={ribbon} /> : null}
    </header>
  );
}

export function Shell({ children, width = "max-w-3xl" }: { children: ReactNode; width?: string }) {
  return (
    <div className="wrap py-10">
      <div className={`mx-auto grid gap-6 ${width}`}>{children}</div>
    </div>
  );
}
