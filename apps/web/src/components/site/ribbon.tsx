"use client";

import { useEffect, useId, useRef } from "react";

// CESAC's running ribbon (components/sections/ribbon.tsx): words ride a fat stroked curve. The text repeats and
// the offset loops over one repeat, measured from a hidden straight copy, so the seam never shows.
const REPEATS = 8;
const SPEED = 46;
const SEP = "   /   ";

export function Ribbon({ items }: { items: readonly string[] }) {
  const uid = useId().replace(/[:«»]/g, "");
  const pathId = `ribbon-${uid}`;
  const textPath = useRef<SVGTextPathElement>(null);
  const ruler = useRef<SVGTextElement>(null);
  const host = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const tp = textPath.current;
    const r = ruler.current;
    const h = host.current;
    if (!tp || !r || !h || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let span = 0;
    const measure = () => {
      const v = r.getComputedTextLength();
      if (Number.isFinite(v) && v > 0) span = v;
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
    let visible = true;
    const io = new IntersectionObserver((es) => es.forEach((e) => (visible = e.isIntersecting)));
    io.observe(h);
    let raf = 0;
    let travelled = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      if (span <= 0) return measure();
      travelled = (travelled + SPEED * dt) % span;
      tp.setAttribute("startOffset", String(-travelled));
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const d = "M-30 96 C 80 46 190 32 300 64 C 400 91 452 116 560 104 C 664 93 712 54 830 46 C 906 41 962 58 1030 76";
  return (
    <svg ref={host} viewBox="-40 0 1090 150" preserveAspectRatio="xMidYMid slice" className="ribbon mt-6 h-24 w-full sm:h-32" aria-hidden>
      <defs>
        <path id={pathId} d={d} fill="none" />
      </defs>
      <use href={`#${pathId}`} stroke="var(--ember)" strokeWidth="44" strokeLinecap="round" fill="none" opacity="0.4" transform="translate(0 8)" />
      <use href={`#${pathId}`} stroke="var(--navy)" strokeWidth="44" strokeLinecap="round" fill="none" />
      <text ref={ruler} className="ribbon-text" x="0" y="-400" opacity="0">
        {items.map((s) => s + SEP).join("")}
      </text>
      <text className="ribbon-text" dominantBaseline="middle" fill="var(--cream)">
        <textPath ref={textPath} href={`#${pathId}`} startOffset="0">
          {Array.from({ length: REPEATS }, () => items.map((s) => s + SEP).join("")).join("")}
        </textPath>
      </text>
    </svg>
  );
}
