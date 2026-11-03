"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { useI18n } from "./i18n-provider";

const STEP_MS = 5000; // four steps x 5 s = the 20-second explainer
const ICONS: IconName[] = ["pen", "lock", "qr", "check"];

/** The 20-second explainer: four framed steps light up in turn. Pausable (WCAG 2.2.2); still if reduced motion. */
export function Explainer() {
  const { t } = useI18n();
  const steps = t.home.explainer.steps;
  const [on, setOn] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setOn((i) => (i + 1) % steps.length), STEP_MS);
    return () => window.clearInterval(id);
  }, [playing, steps.length]);

  return (
    <section aria-labelledby="how" className="card p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="how" className="text-4xl sm:text-5xl">
          {t.home.explainer.title}
        </h2>
        <Button tone="ghost" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing} data-testid="explainer-toggle">
          <Icon name={playing ? "pause" : "play"} />
          {playing ? t.home.explainer.pause : t.home.explainer.play}
        </Button>
      </div>
      <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="explainer-step" data-on={i === on}>
            <button
              type="button"
              className="flex w-full min-h-14 cursor-pointer flex-col items-start gap-3 border-0 bg-transparent p-0 text-left text-inherit"
              onClick={() => {
                setOn(i);
                setPlaying(false);
              }}
              aria-current={i === on ? "step" : undefined}
            >
              <span className="flex items-center gap-3">
                <span className="explainer-num">{i + 1}</span>
                <Icon name={ICONS[i]} className="text-3xl" />
              </span>
              <span className="font-display text-3xl font-black uppercase leading-none">{s.title}</span>
              <span className="font-medium">{s.body}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="explainer-bar mt-5" aria-hidden>
        <span
          key={`${on}-${playing}`}
          style={{
            transform: `scaleX(${(on + 1) / steps.length})`,
            transition: playing ? `transform ${STEP_MS}ms linear` : undefined,
          }}
        />
      </div>
    </section>
  );
}
