import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { SAMPLE_BUTTONS } from "@/lib/samples";
import { SigilLogo } from "@/components/site/sigil-logo";

// The Sigil home, on the CESAC Fantastic 4 page structure (cesac-app/src/components/f4). The markup keeps
// CESAC's class names so f4.css and motion.tsx drive it unchanged. Replaced for Sigil: the circled-4 badge is a
// Sigil seal, the giant 4 in the light shaft is a seal outline, and no line quotes a Marvel character.

type T = Dict["site"]["home"];
type Power = "flame" | "stretch" | "shield" | "rock";
const style = (o: Record<string, string | number>) => o as React.CSSProperties;

export function Spark({ s }: { s: Record<string, string> }) {
  return <span className="spark" style={style(s)} aria-hidden />;
}

export function Curve({ id, d, text, colour, direction = 1, className = "curve-band" }: { id: string; d: string; text: string; colour: string; direction?: 1 | -1; className?: string }) {
  return (
    <div className={className} aria-hidden>
      <svg className="curve" viewBox="0 0 1200 180" data-dir={direction}>
        <path id={id} d={d} fill="none" />
        <text style={{ fill: colour }}>
          <textPath href={`#${id}`} startOffset={direction === 1 ? "0%" : "-50%"}>
            {`${text} ${text} ${text}`}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

const SEEN_SCRIPT =
  "(function(){var h=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('f4-motion');try{if(sessionStorage.getItem('sigil-seen'))h.classList.add('f4-seen');sessionStorage.setItem('sigil-seen','1')}catch(e){}})()";

export function Loader() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SEEN_SCRIPT }} />
      <div className="f4-loader" aria-hidden>
        <div className="emblem">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="96" pathLength={1} />
          </svg>
          <div className="quads">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <p>Sigil</p>
      </div>
    </>
  );
}

export function Hero({ t }: { t: T }) {
  return (
    <section className="hero" aria-labelledby="f4-hero-title">
      <svg className="orbits" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <circle cx="720" cy="300" r="210" />
        <circle className="f" cx="720" cy="300" r="320" />
        <circle className="f2" cx="720" cy="300" r="460" />
        <circle className="dot" cx="930" cy="300" r="7" />
        <circle className="dot" cx="400" cy="300" r="5" />
      </svg>
      <Spark s={{ left: "12%", top: "24%", "--s": "22px", "--c": "var(--cream)" }} />
      <Spark s={{ left: "84%", top: "18%", "--s": "16px", "--c": "var(--ember)", animationDelay: "-1.2s" }} />
      <Spark s={{ left: "78%", top: "66%", "--s": "12px", "--c": "var(--cream)", animationDelay: "-2.1s" }} />
      <div className="hero-in wrap">
        <div className="coin-wrap rise" style={style({ "--i": 0 })} aria-hidden>
          <div className="coin-tilt">
            <div className="coin">
              <div className="coin-face front">
                <svg viewBox="0 0 400 400">
                  <defs>
                    <path id="sigil-ringtext" d="M200 200 m-170 0 a170 170 0 1 1 340 0 a170 170 0 1 1 -340 0" />
                    <clipPath id="sigil-disc">
                      <circle cx="200" cy="200" r="150" />
                    </clipPath>
                  </defs>
                  <circle cx="200" cy="200" r="196" fill="#FFF5E3" stroke="#0B2350" strokeWidth="4" />
                  <circle cx="200" cy="200" r="150" fill="#1F6FD1" />
                  <g clipPath="url(#sigil-disc)" stroke="#FFF5E3" strokeWidth="9" opacity=".9">
                    <path d="M40 150 170 20M40 178 198 20M40 206 226 20M40 234 254 20" />
                  </g>
                  <path d="M200 84 222 178 316 200 222 222 200 316 178 222 84 200 178 178Z" fill="#FFB23A" stroke="#0B2350" strokeWidth="6" strokeLinejoin="round" />
                  <path d="m162 202 28 28 50-54" fill="none" stroke="#0B2350" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="200" cy="200" r="150" fill="none" stroke="#0B2350" strokeWidth="4" />
                  <text fontWeight="700" fontSize="17" letterSpacing="5" fill="#1F6FD1" style={{ fontFamily: "var(--fm)" }}>
                    <textPath href="#sigil-ringtext" startOffset="2%">
                      SIGIL · VERIFIED BY SIGNATURE · NOT BY PHONE CALL · TEAM SIGIL ·
                    </textPath>
                  </text>
                </svg>
              </div>
              <div className="coin-face back">
                <span className="mark" />
                <span>Sigil</span>
              </div>
            </div>
          </div>
        </div>
        <span className="eyebrow rise" style={style({ "--i": 1 })}>
          {t.eyebrow}
        </span>
        <h1 id="f4-hero-title" className="rise" style={style({ "--i": 2 })}>
          <span className="l1">{t.l1}</span>
          <span className="l2">{t.l2}</span>
        </h1>
        <p className="sub rise" style={style({ "--i": 3 })}>
          {t.sub}
        </p>
        <div className="ctas rise" style={style({ "--i": 4 })}>
          <Link className="btn" href="/check" data-testid="hero-check">
            {t.ctaCheck}
          </Link>
          <Link className="btn ghost" href="/wallet" data-testid="hero-wallet">
            {t.ctaWallet}
          </Link>
          <Link className="btn" href="/sign" data-testid="hero-sign">
            {t.ctaSign}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Statement({ t }: { t: T }) {
  const at = t.statement.indexOf(t.statementHl);
  const parts =
    at < 0
      ? [{ s: t.statement, hl: false }]
      : [
          { s: t.statement.slice(0, at), hl: false },
          { s: t.statementHl, hl: true },
          { s: t.statement.slice(at + t.statementHl.length), hl: false },
        ];
  return (
    <section className="sec statement wrap" id="what">
      <Spark s={{ "--s": "46px", "--c": "var(--ember)" }} />
      <div className="kicker">
        <span className="bar" />
        <span className="label">{t.statementKicker}</span>
      </div>
      <p className="big">
        {parts.map((p, i) =>
          p.hl ? (
            <span key={i} className="w hl">
              {p.s}
            </span>
          ) : (
            p.s.split(/(\s+)/).map((w, j) =>
              w.trim() ? (
                <span key={`${i}-${j}`} className="w">
                  {w}
                </span>
              ) : (
                w
              ),
            )
          ),
        )}
      </p>
      <p className="hand">{t.statementHand}</p>
    </section>
  );
}

function Glyph({ power }: { power: Power }) {
  if (power === "flame")
    return (
      <svg viewBox="0 0 120 120">
        <path className="flick" d="M60 112C30 112 18 92 24 70c5-18 20-22 18-44 14 10 22 26 20 40 6-6 8-14 6-22 16 12 30 30 28 50-2 18-16 18-36 18Z" fill="#FF6A2B" stroke="#FFF5E3" strokeWidth="3" strokeLinejoin="round" />
        <path className="flick b" d="M60 110c-14 0-20-10-17-21 3-9 10-11 9-22 8 6 12 13 11 20 4-3 5-7 4-11 8 6 13 15 12 22-1 10-9 12-19 12Z" fill="#FFB23A" />
      </svg>
    );
  if (power === "stretch")
    return (
      <svg viewBox="0 0 160 120">
        <g className="band">
          <path d="M10 60c15-40 30 40 45 0s30 40 45 0 30 40 50 0" fill="none" stroke="#0B2350" strokeWidth="16" strokeLinecap="round" />
          <path d="M10 60c15-40 30 40 45 0s30 40 45 0 30 40 50 0" fill="none" stroke="#6FB6FF" strokeWidth="8" strokeLinecap="round" />
        </g>
      </svg>
    );
  if (power === "shield")
    return (
      <svg viewBox="0 0 120 120">
        <g className="field">
          <path d="M60 8 105 34v52L60 112 15 86V34Z" fill="none" stroke="#1F6FD1" strokeWidth="4" strokeDasharray="10 7" />
        </g>
        <path d="M60 30 86 45v30L60 90 34 75V45Z" fill="#FFF5E3" stroke="#0B2350" strokeWidth="4" />
        <circle cx="60" cy="60" r="8" fill="#1F6FD1" />
      </svg>
    );
  return (
    <svg viewBox="0 0 130 120">
      <g stroke="#0B2350" strokeWidth="3.5" strokeLinejoin="round">
        <path d="M10 40 40 14 70 22 62 54 30 64Z" fill="#B98552" />
        <path d="M70 22 104 12 120 44 92 60 62 54Z" fill="#D99A5B" />
        <path d="M30 64 62 54 92 60 86 96 44 104 14 84Z" fill="#C98A4E" />
        <path d="M92 60 120 44 124 84 86 96Z" fill="#B98552" />
      </g>
    </svg>
  );
}

const CARD: Record<Power, string> = { flame: "k-flame", stretch: "k-stretch", shield: "k-invis", rock: "k-rock" };

export function Powers({ t }: { t: T }) {
  const items: [Power, { label: string; title: string; body: string; note: string }][] = [
    ["flame", t.powers.issue],
    ["stretch", t.powers.resume],
    ["shield", t.powers.privacy],
    ["rock", t.powers.trust],
  ];
  return (
    <section className="powers" id="powers">
      <div className="powers-inner wrap">
        <div className="powers-head">
          <h2>
            <span className="script">{t.powers.the}</span>
            {t.powers.title}
          </h2>
          <p className="hand">{t.powers.hand}</p>
        </div>
        <div className="cards">
          {items.map(([p, c]) => (
            <div key={p} className="tilt">
              <article className={`card ${CARD[p]}`}>
                <span className="label">
                  <span>{c.label}</span>
                </span>
                <div className="glyph" aria-hidden>
                  <Glyph power={p} />
                </div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <span className="after">{c.note}</span>
                <span className="glare" aria-hidden />
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Doors({ t }: { t: T }) {
  return (
    <section className="sec events wrap" id="doors">
      <div className="sec-head">
        <div>
          <div className="kicker">
            <span className="bar" />
            <span className="label">{t.doors.kicker}</span>
          </div>
          <h2>{t.doors.title}</h2>
        </div>
        <p>{t.doors.aside}</p>
      </div>
      <nav aria-label={t.doors.title}>
        <article className="feature">
          <div className="feature-copy">
            <h3>{t.doors.check.title}</h3>
            <p className="blurb">{t.doors.check.body}</p>
            <div className="row">
              <Link href="/check" className="btn dark" data-testid="door-check">
                {t.doors.check.cta}
              </Link>
              <Link href="/recruiter" className="btn">
                {t.doors.check.cta2}
              </Link>
            </div>
          </div>
          <div className="feature-art" aria-hidden>
            <span className="ring" />
            <span className="ring b" />
            <span className="mark" />
          </div>
        </article>
        <div className="others">
          {[
            { href: "/wallet", testid: "door-wallet", ...t.doors.wallet },
            { href: "/sign", testid: "door-sign", ...t.doors.sign },
            { href: "/paper", testid: "door-paper", ...t.doors.paper },
          ].map((d) => (
            <article key={d.href} className="other">
              <h3>
                <Link href={d.href} className="stretch" data-testid={d.testid}>
                  {d.title}
                </Link>
              </h3>
              <p>{d.body}</p>
            </article>
          ))}
        </div>
      </nav>
    </section>
  );
}

const PATTERNS = [
  "repeating-conic-gradient(var(--ember) 0 25%,var(--cream) 0 50%) 0 0/60px 60px",
  "radial-gradient(circle at 30% 30%,var(--ember) 0 18%,transparent 19%) 0 0/70px 70px,var(--sky)",
  "repeating-linear-gradient(45deg,var(--sky-2) 0 22px,var(--cream) 22px 44px)",
  "linear-gradient(var(--flame) 50%,var(--ember) 0) 0 0/100% 80px",
  "repeating-radial-gradient(circle at 50% 120%,var(--sky) 0 26px,var(--cream) 26px 52px)",
  "conic-gradient(from 45deg,var(--ember),var(--flame),var(--sky),var(--stone),var(--ember))",
];

export function Rail({ t, tags }: { t: T; tags: Record<string, string> }) {
  return (
    <section className="sec rail-sec" id="attack">
      <div className="rail-head wrap">
        <p className="hand">{t.rail.hand}</p>
        <div className="rail-ctl">
          <button type="button" className="prev" aria-label={t.rail.prev}>
            ←
          </button>
          <button type="button" className="next" aria-label={t.rail.next}>
            →
          </button>
        </div>
        <h2>{t.rail.title}</h2>
      </div>
      <div className="rail">
        <div className="track">
          {SAMPLE_BUTTONS.map((c, i) => (
            <div key={c.id} className="tilt">
              <Link href={`/check?s=${c.id}`} className="cover" draggable={false} data-testid={`cover-${c.id}`}>
                <div className="cover-art" style={style({ "--pat": PATTERNS[i % PATTERNS.length] })}>
                  <div className="masthead">
                    <b>Sigil</b>
                    <i>
                      No.
                      <br />
                      {i + 1}
                    </i>
                  </div>
                  <span className="mark" />
                </div>
                <div className="cover-body">
                  <span className="tag">{t.rail.sample}</span>
                  <h3>{c.person}</h3>
                  <p>{c.tags.map((x) => tags[x]).join(" · ")}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Shaft({ t }: { t: T }) {
  return (
    <div className="pin-wrap">
      <section className="sec shaft-sec" aria-labelledby="f4-shaft-title">
        <svg className="four-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
          <path d="M500 60 590 410 940 500 590 590 500 940 410 590 60 500 410 410Z" />
          <path d="M500 150 565 435 850 500 565 565 500 850 435 565 150 500 435 435Z" />
        </svg>
        <div className="shaft" aria-hidden>
          <canvas />
        </div>
        <div className="ground" aria-hidden />
        <div className="shaft-copy">
          <span className="shaft-word">{t.shaft.word}</span>
          <h2 id="f4-shaft-title">
            <span className="script">{t.shaft.the}</span>
            {t.shaft.title}
          </h2>
          <p>{t.shaft.body}</p>
        </div>
      </section>
    </div>
  );
}

export function Enter({ t }: { t: T }) {
  return (
    <div className="pin-wrap">
      <section className="sec enter" id="start" aria-labelledby="f4-enter-title">
        <p className="enter-hint hand" aria-hidden>
          {t.enter.hint}
        </p>
        <div className="enter-fill" aria-hidden />
        <div className="enter-key" aria-hidden>
          <div className="cap">
            <b className="bt" />
            <b className="n" />
            <b className="s" />
            <b className="e" />
            <b className="w" />
            <b className="t">
              Check <span>↵</span>
            </b>
          </div>
        </div>
        <div className="enter-copy">
          <span className="script" aria-hidden>
            {t.enter.script}
          </span>
          <h2 id="f4-enter-title">{t.enter.title}</h2>
          <p>{t.enter.body}</p>
          <Link className="btn ghost" href="/check" data-testid="enter-check">
            {t.enter.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}

const LADDER_COLOURS = ["#FF7A33", "#6FB6FF", "#CDEEF8", "#E3C08F", "#FFB23A"];

export function Ladder({ t, team }: { t: T; team: string[] }) {
  return (
    <section className="sec vert" id="witness">
      <div className="wrap">
        <div className="kicker">
          <span className="bar" />
          <span className="label">{t.ladder.teamKicker}</span>
        </div>
        <div className="leaders">
          <div>
            <p className="label">{t.ladder.teamLabel}</p>
            <p className="names">{team.join(", ")}</p>
          </div>
        </div>
        <div className="kicker">
          <span className="bar" />
          <span className="label">{t.ladder.kicker}</span>
        </div>
        <div className="vert-grid">
          <div className="v-list">
            {t.ladder.rungs.map((r, i) => (
              <div key={r.title} className={`v-item${i === 0 ? " on" : ""}`} data-i={i} style={style({ "--vc": LADDER_COLOURS[i] })}>
                {r.title}
                <small>{r.tag}</small>
              </div>
            ))}
          </div>
          <div className="v-panels" aria-live="polite">
            {t.ladder.rungs.map((r, i) => (
              <aside key={r.title} className={`v-panel${i === 0 ? " on" : ""}`} data-i={i} style={style({ "--vc": LADDER_COLOURS[i] })}>
                <span className="label">{r.tag}</span>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </aside>
            ))}
          </div>
        </div>
        <Link href="/registry" className="all-link" data-testid="to-registry">
          <span>
            <b>{t.ladder.link}</b>
            <span style={{ display: "block", marginTop: 6, color: "#b8c7de" }}>{t.ladder.linkSub}</span>
          </span>
          <span aria-hidden style={{ fontSize: 28 }}>
            →
          </span>
        </Link>
      </div>
    </section>
  );
}

const STICKERS: [string, string][] = [
  ["", "var(--flame)"],
  ["", "var(--ember)"],
  ["s-script", "var(--p-stretch)"],
  ["s-burst", "var(--ember)"],
  ["s-octo", "var(--cream)"],
  ["", "var(--stone)"],
  ["s-script", "var(--cream)"],
  ["", "var(--sky-2)"],
  ["s-octo", "var(--ember)"],
];

export function Stickers({ t }: { t: T }) {
  return (
    <section className="sec stick" aria-labelledby="f4-stick-title">
      <h2 id="f4-stick-title">{t.stickers.title}</h2>
      <p className="hand">{t.stickers.hand}</p>
      <div className="pile">
        <div className="center" aria-hidden>
          <SigilLogo className="h-full w-full" />
        </div>
        {t.stickers.items.map((label, i) => {
          const [shape, colour] = STICKERS[i % STICKERS.length];
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <span
              key={label}
              className={`sticker ${shape}`}
              style={style({ background: colour, left: `${4 + col * 31 + (row % 2) * 5}%`, top: `${2 + row * 22}%`, "--rot": `${((i * 37) % 24) - 12}deg` })}
            >
              {label}
            </span>
          );
        })}
      </div>
    </section>
  );
}
