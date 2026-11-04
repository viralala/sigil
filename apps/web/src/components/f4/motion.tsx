"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Everything on the Fantastic 4 home that moves when you scroll or drag.
 *
 * The sections are server components and render complete without this: it
 * only adds motion to markup that is already there, by class name, the way
 * the prototype the committee approved did. What it owns and what it leaves:
 *
 * - It never adds or removes a node React rendered. The two pinned scenes sit
 *   inside a `.pin-wrap` React owns, so the pin's spacer goes inside that and
 *   leaving the page never asks React to remove a node GSAP has moved.
 * - It adds `f4-motion` to <html> (the page's inline script usually already
 *   has, before first paint) and takes it off again on the way out, so other
 *   pages are untouched. Reduced motion gets none of it.
 * - Everything it starts, it stops on unmount: the smooth scroll, the ticker
 *   callbacks, every ScrollTrigger and listener.
 */
export function F4Motion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".f4");
    if (!root) return;
    const html = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    const ac = new AbortController();
    const on = { signal: ac.signal };
    const one = <T extends Element>(s: string) => root.querySelector<T>(s);
    const all = <T extends Element>(s: string) => [...root.querySelectorAll<T>(s)];

    // The loader plays once a visit. Coming back to this page by a link does
    // not run the inline script again, so the visit is marked here as well.
    const seen = window.setTimeout(() => html.classList.add("f4-seen"), 3200);

    if (reduce) {
      html.classList.remove("f4-motion");
      return () => {
        window.clearTimeout(seen);
        html.classList.add("f4-seen");
      };
    }

    html.classList.add("f4-motion");
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const tickers: gsap.TickerCallback[] = [];
    const tick = (fn: gsap.TickerCallback) => {
      gsap.ticker.add(fn);
      tickers.push(fn);
    };

    /* ---------- smooth scroll ---------- */
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    tick((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    root.addEventListener(
      "click",
      (e) => {
        const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
        if (!a) return;
        const target = document.getElementById(a.getAttribute("href")!.slice(1));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4 });
      },
      on,
    );

    /* ---------- the verticals ---------- */
    const items = all<HTMLElement>(".v-item");
    const panels = all<HTMLElement>(".v-panel");
    const setVert = (i: number) => {
      items.forEach((el, j) => el.classList.toggle("on", j === i));
      panels.forEach((el, j) => el.classList.toggle("on", j === i));
    };
    items.forEach((el, i) => el.addEventListener("mouseenter", () => setVert(i), on));

    /* ---------- the badge leans toward the pointer ---------- */
    const hero = one<HTMLElement>(".hero");
    const coinTilt = one<HTMLElement>(".coin-tilt");
    if (fine && hero && coinTilt) {
      hero.addEventListener(
        "pointermove",
        (e) => {
          const x = e.clientX / innerWidth - 0.5;
          const y = e.clientY / innerHeight - 0.5;
          coinTilt.style.transform = `rotateX(${(-y * 22).toFixed(1)}deg) rotateZ(${(x * 8).toFixed(1)}deg)`;
        },
        on,
      );
      hero.addEventListener("pointerleave", () => (coinTilt.style.transform = ""), on);
    }

    /* ---------- cards and covers tilt in 3D under the pointer ---------- */
    let railDragging = false;
    if (fine) {
      all<HTMLElement>(".tilt").forEach((w) => {
        const card = w.firstElementChild as HTMLElement | null;
        w.addEventListener(
          "pointermove",
          (e) => {
            if (railDragging || !card) return;
            const r = w.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            card.style.setProperty("--gx", `${px * 100}%`);
            card.style.setProperty("--gy", `${py * 100}%`);
            w.style.transform = `rotateY(${((px - 0.5) * 18).toFixed(1)}deg) rotateX(${((0.5 - py) * 14).toFixed(1)}deg) scale(1.03)`;
          },
          on,
        );
        w.addEventListener("pointerleave", () => (w.style.transform = ""), on);
      });
    }

    /* ---------- the rail: drag it, or use the arrows ---------- */
    const rail = one<HTMLElement>(".rail");
    const track = one<HTMLElement>(".track");
    if (rail && track) {
      let rx = 0;
      let rt = 0;
      let startX = 0;
      let startT = 0;
      let down = false;
      let moved = false;
      const min = () => Math.min(0, rail.clientWidth - track.scrollWidth);
      rail.addEventListener(
        "pointerdown",
        (e) => {
          down = true;
          moved = false;
          startX = e.clientX;
          startT = rt;
        },
        on,
      );
      rail.addEventListener(
        "pointermove",
        (e) => {
          if (!down) return;
          const dx = e.clientX - startX;
          // Only a real drag captures the pointer, so a tap still opens a cover.
          if (!moved && Math.abs(dx) > 6) {
            moved = true;
            railDragging = true;
            rail.setPointerCapture(e.pointerId);
          }
          if (moved) rt = gsap.utils.clamp(min() - 80, 80, startT + dx * 1.2);
        },
        on,
      );
      const up = () => {
        down = false;
        railDragging = false;
        rt = gsap.utils.clamp(min(), 0, rt);
      };
      rail.addEventListener("pointerup", up, on);
      rail.addEventListener("pointercancel", up, on);
      // A drag that ends on a cover is not a click on it.
      rail.addEventListener(
        "click",
        (e) => {
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
            moved = false;
          }
        },
        { capture: true, signal: ac.signal },
      );
      one<HTMLButtonElement>(".rail-ctl .prev")?.addEventListener(
        "click",
        () => (rt = gsap.utils.clamp(min(), 0, rt + 360)),
        on,
      );
      one<HTMLButtonElement>(".rail-ctl .next")?.addEventListener(
        "click",
        () => (rt = gsap.utils.clamp(min(), 0, rt - 360)),
        on,
      );
      tick(() => {
        const v = rt - rx;
        if (Math.abs(v) < 0.05 && rx === rt) return;
        rx += v * 0.12;
        if (Math.abs(rt - rx) < 0.05) rx = rt;
        track.style.transform = `translate3d(${rx.toFixed(1)}px,0,0) skewX(${gsap.utils.clamp(-8, 8, -v * 0.03).toFixed(2)}deg)`;
      });
    }

    /* ---------- stickers: pick one up and throw it ---------- */
    all<HTMLElement>(".sticker").forEach((el) => {
      let sx = 0;
      let sy = 0;
      let ox = 0;
      let oy = 0;
      let held = false;
      el.addEventListener(
        "pointerdown",
        (e) => {
          held = true;
          el.setPointerCapture(e.pointerId);
          sx = e.clientX;
          sy = e.clientY;
          ox = Number(gsap.getProperty(el, "x"));
          oy = Number(gsap.getProperty(el, "y"));
          gsap.to(el, { scale: 1.08, duration: 0.2 });
          el.style.zIndex = "5";
        },
        on,
      );
      el.addEventListener(
        "pointermove",
        (e) => {
          if (held) gsap.set(el, { x: ox + e.clientX - sx, y: oy + e.clientY - sy });
        },
        on,
      );
      const drop = () => {
        if (!held) return;
        held = false;
        el.style.zIndex = "";
        el.style.setProperty("--rot", `${gsap.utils.random(-14, 14)}deg`);
        gsap.to(el, { scale: 1, duration: 0.6, ease: "elastic.out(1,.4)" });
      };
      el.addEventListener("pointerup", drop, on);
      el.addEventListener("pointercancel", drop, on);
    });

    /* ---------- rain inside the light shaft ---------- */
    const canvas = one<HTMLCanvasElement>(".shaft canvas");
    const g = canvas?.getContext("2d");
    let shaftOn = false;
    type Drop = { x: number; y: number; l: number; v: number; a: number };
    let drops: Drop[] = [];
    const sizeRain = () => {
      if (!canvas) return;
      const r = devicePixelRatio || 1;
      canvas.width = Math.max(1, canvas.offsetWidth * r);
      canvas.height = Math.max(1, canvas.offsetHeight * r);
      drops = Array.from({ length: 90 }, () => ({
        x: Math.random(),
        y: Math.random(),
        l: 0.05 + Math.random() * 0.2,
        v: 0.004 + Math.random() * 0.01,
        a: 0.15 + Math.random() * 0.4,
      }));
    };
    const drawRain = () => {
      if (!canvas || !g) return;
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.lineWidth = 1.2 * (devicePixelRatio || 1);
      for (const d of drops) {
        d.y += d.v;
        if (d.y > 1.1) {
          d.y = -d.l;
          d.x = Math.random();
        }
        g.strokeStyle = `rgba(255,255,255,${d.a})`;
        g.beginPath();
        g.moveTo(d.x * canvas.width, d.y * canvas.height);
        g.lineTo(d.x * canvas.width, (d.y + d.l) * canvas.height);
        g.stroke();
      }
    };
    sizeRain();
    window.addEventListener("resize", sizeRain, on);
    tick(() => {
      if (shaftOn) drawRain();
    });

    /* ---------- scroll choreography, once the fonts are in ---------- */
    let ctx: gsap.Context | null = null;
    const splits: SplitText[] = [];
    let dead = false;

    const build = () => {
      if (dead) return;
      ctx = gsap.context(() => {
        // How it works: the words fill in as you read
        gsap.to(".statement .big .w", {
          opacity: 1,
          stagger: 0.12,
          ease: "none",
          scrollTrigger: { trigger: ".statement", start: "top 70%", end: "bottom 60%", scrub: true },
        });
        gsap.from(".statement .hand", {
          rotate: -12,
          scale: 0.6,
          opacity: 0,
          scrollTrigger: { trigger: ".statement .hand", start: "top 92%", toggleActions: "play none none reverse" },
        });

        // The four powers: the panel opens out of an inset card, the fanned cards straighten
        gsap.fromTo(
          ".powers-inner",
          { clipPath: "inset(7% 5% 7% 5% round 44px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: ".powers", start: "top 85%", end: "top 15%", scrub: true },
          },
        );
        const fan = [
          [-9, 60, -40],
          [-3, 20, -10],
          [4, 50, 20],
          [10, 90, 50],
        ];
        all<HTMLElement>(".card").forEach((c, i) => {
          const [r, y, x] = fan[i % fan.length];
          gsap.fromTo(
            c,
            { rotation: r, y, x },
            {
              rotation: 0,
              y: 0,
              x: 0,
              ease: "none",
              scrollTrigger: { trigger: ".cards", start: "top 95%", end: "top 40%", scrub: true },
            },
          );
        });

        // Big headings rise letter by letter
        [".powers h2", ".events .sec-head h2", ".rail-head h2", ".stick h2"].forEach((sel) => {
          const el = one<HTMLElement>(sel);
          if (!el) return;
          const sp = new SplitText(el, { type: "lines,chars", mask: "lines" });
          splits.push(sp);
          gsap.from(sp.chars, {
            yPercent: 110,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.02,
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
          });
        });

        gsap.from(".feature, .other", {
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.08,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: ".events", start: "top 70%" },
        });

        // The covers drift in from the right
        gsap.from(".track > .tilt", {
          x: 200,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.07,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: ".rail", start: "top 80%" },
        });

        // The light shaft: pinned, it opens from a thread and the 4 draws itself
        const lines = all<SVGPathElement>(".four-lines path");
        lines.forEach((p) => {
          const len = p.getTotalLength();
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: ".shaft-sec",
              start: "top top",
              end: "+=140%",
              pin: true,
              scrub: 1,
              onToggle: (s) => {
                shaftOn = s.isActive;
                if (s.isActive) sizeRain();
              },
            },
          })
          .fromTo(
            ".shaft",
            { width: 2, opacity: 0.4 },
            {
              width: () => (innerWidth < 760 ? innerWidth * 0.86 : Math.max(420, Math.min(innerWidth * 0.4, 560))),
              opacity: 1,
              duration: 1,
              ease: "power2.inOut",
            },
          )
          .to(lines, { strokeDashoffset: 0, duration: 1.2, stagger: 0.15, ease: "none" }, 0.2)
          .from(".shaft-word", { letterSpacing: "1.4em", opacity: 0, duration: 0.6 }, 0.5)
          .from(".shaft-copy h2, .shaft-copy p", { y: 60, opacity: 0, stagger: 0.15, duration: 0.6 }, 0.8);

        // Enter: the key flattens, gets pressed, and floods the screen with flame
        gsap
          .timeline({
            scrollTrigger: { trigger: ".enter", start: "top top", end: "+=170%", pin: true, scrub: 1 },
          })
          .fromTo(
            ".enter-key",
            { rotationX: 58, rotationZ: -10, scale: 0.7, y: 60 },
            { rotationX: 18, rotationZ: 0, scale: 1, y: 0, duration: 1, ease: "power2.out" },
          )
          .to(".enter-key", { rotationX: 0, duration: 0.4 })
          .to(".enter-key", { y: 18, scale: 0.94, duration: 0.18, ease: "power2.in" })
          .to(".enter-fill", { scale: 30, duration: 1, ease: "power2.in" }, ">-0.05")
          .to(".enter-key", { scale: 0.4, opacity: 0, duration: 0.5 }, "<.2")
          .to(".enter-hint", { opacity: 0, duration: 0.2 }, 0)
          .from(".enter-copy > *", { y: 60, opacity: 0, stagger: 0.12, duration: 0.5 }, "-=.3");

        // The verticals: whichever name crosses the middle lights up
        items.forEach((el, i) =>
          ScrollTrigger.create({
            trigger: el,
            start: "top 60%",
            end: "bottom 40%",
            onToggle: (s) => {
              if (s.isActive) setVert(i);
            },
          }),
        );

        // The stickers fall into the pile, the 4 badge spins in
        gsap.from(".sticker", {
          y: () => -innerHeight * 0.8,
          duration: 1.3,
          ease: "bounce.out",
          stagger: { each: 0.06, from: "random" },
          scrollTrigger: { trigger: ".pile", start: "top 75%" },
        });
        gsap.from(".pile .center", {
          scale: 0.3,
          rotation: -200,
          opacity: 0,
          duration: 1.2,
          ease: "back.out(1.5)",
          scrollTrigger: { trigger: ".pile", start: "top 75%" },
        });

        // Every curved line rides the scroll, each in its own direction
        all<SVGSVGElement>(".curve").forEach((svg) => {
          const path = svg.querySelector("textPath");
          if (!path) return;
          const left = svg.dataset.dir !== "-1";
          gsap.fromTo(
            path,
            { attr: { startOffset: left ? "0%" : "-50%" } },
            {
              attr: { startOffset: left ? "-50%" : "0%" },
              ease: "none",
              scrollTrigger: { trigger: svg, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        gsap.from(".closing .ln > span", {
          yPercent: 105,
          duration: 1,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".closing", start: "top 85%", toggleActions: "play none none reverse" },
        });
      }, root);
      ScrollTrigger.refresh();
    };

    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(build);

    return () => {
      dead = true;
      window.clearTimeout(seen);
      html.classList.add("f4-seen");
      html.classList.remove("f4-motion");
      ac.abort();
      splits.forEach((s) => s.revert());
      ctx?.revert();
      tickers.forEach((fn) => gsap.ticker.remove(fn));
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
