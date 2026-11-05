"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { reel, reelTrade } from "@/lib/data/reel";
import { hasFittingPicture } from "@/lib/data/trades";
import { matchTrade, splitSentence } from "@/lib/match";
import { Nav } from "./Nav";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EMERGENCY_TEXT = {
  gas: "Gas smell? Turn off the cylinder if it is safe, keep switches off and leave the house. Call for help first.",
  fire: "If there is fire or smoke, get out and call your emergency number first.",
  "electric-shock": "If someone had a shock, call your emergency number first. Do not touch live wires.",
} as const;

/** Shrinks a half of the sentence just enough to fit its side of the frame. */
function useFitHalf(text: string, deps: unknown[]) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const fit = () => {
      const word = box.firstElementChild as HTMLElement | null;
      if (!word) return;
      box.style.fontSize = "";
      const available = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) - parseFloat(getComputedStyle(box).paddingRight);
      const needed = word.getBoundingClientRect().width;
      if (needed > available && needed > 0) {
        const size = parseFloat(getComputedStyle(box).fontSize);
        box.style.fontSize = `${Math.max(20, Math.floor(size * (available / needed)))}px`;
      }
    };
    fit();
    void document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, ...deps]);
  return ref;
}

export function HeroSearch() {
  const root = useRef<HTMLElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const swapped = useRef(false);

  const hasTyped = typed.trim().length > 0;
  const result = useMemo(() => matchTrade(typed), [typed]);
  const current = reel[step]!;
  const [typedFirst, typedSecond] = useMemo(() => splitSentence(typed), [typed]);
  const first = hasTyped ? typedFirst : current.first;
  const second = hasTyped ? typedSecond : current.second;

  const firstRef = useFitHalf(first, [step]);
  const secondRef = useFitHalf(second, [step]);

  const goTo = useCallback((next: number) => {
    setStep((prev) => {
      if (prev !== next) swapped.current = true;
      return next;
    });
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const frames = gsap.utils.toArray<HTMLElement>(".hero__frame");
          const count = reel.length;
          const distance = () => {
            const frame = frames[0];
            if (!frame) return 0;
            return frame.offsetHeight + parseFloat(getComputedStyle(frame).marginBottom);
          };
          const stage = () => root.current?.querySelector<HTMLElement>(".hero__window");
          const sizePhoneFrames = () => {
            const win = stage();
            if (!win) return;
            if (window.matchMedia("(max-width: 820px)").matches) {
              win.style.setProperty("--frame-h", `${Math.max(120, win.clientHeight - 80)}px`);
            } else {
              win.style.removeProperty("--frame-h");
            }
          };
          // The first frame in the reel is a copy of the last, so a sliver shows above the first picture.
          const offset = () => {
            const win = stage();
            const frame = frames[0];
            if (!win || !frame) return 0;
            return (win.clientHeight - frame.offsetHeight) / 2 - distance();
          };
          const motion = Boolean(ctx.conditions?.motion);

          const place = () => {
            sizePhoneFrames();
            gsap.set(reelRef.current, { y: offset() });
          };
          place();

          // The words follow whichever picture is closest to the centre, so they never disagree.
          const syncWords = () => {
            const y = Number(gsap.getProperty(reelRef.current, "y"));
            const travelled = (offset() - y) / (distance() || 1);
            goTo(gsap.utils.clamp(0, count - 1, Math.round(travelled)));
          };

          ScrollTrigger.addEventListener("refreshInit", place);
          const removeRefresh = () => ScrollTrigger.removeEventListener("refreshInit", place);

          if (!motion) {
            // Reduced motion: no travel. Each picture simply replaces the last as you scroll.
            ScrollTrigger.create({
              trigger: root.current,
              start: "top top",
              end: "bottom bottom",
              onUpdate: (self) => {
                const index = Math.min(count - 1, Math.floor(self.progress * count));
                gsap.set(reelRef.current, { y: offset() - distance() * index });
                goTo(index);
              },
            });
            return removeRefresh;
          }

          // Each picture holds while the sentence reads, then travels on to the next.
          const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            onUpdate: syncWords,
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          });
          for (let i = 1; i < count; i++) {
            tl.to(reelRef.current, { y: () => offset() - distance() * i, duration: 1 }, (i - 1) * 1.4 + 0.2);
          }
          tl.to({}, { duration: 0.2 });

          // After client-side navigation the page height settles late, so measure again.
          const remeasure = window.requestAnimationFrame(() => ScrollTrigger.refresh());
          void document.fonts?.ready.then(() => ScrollTrigger.refresh());

          return () => {
            window.cancelAnimationFrame(remeasure);
            removeRefresh();
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  const prev = reel[reel.length - 1]!;
  const next = reel[0]!;
  const answer = hasTyped ? result.trade : reelTrade(current);

  const typedPicture = hasTyped && result.trade && hasFittingPicture(result.trade);
  const swapClass = swapped.current ? "is-swap" : "is-first";
  const destination = hasTyped ? `/job?q=${encodeURIComponent(typed.trim())}` : "/job";

  return (
    <section ref={root} className="hero" aria-label="Find someone" id="top">
      <div className="hero__stage">
        <div className="hero__nav"><Nav action={false} /></div>

        <div className="hero__window">
          <div className="hero__reel" ref={reelRef} aria-hidden="true">
            <div className="hero__frame">
              <Image src={prev.image} alt="" fill sizes="(max-width: 820px) 100vw, 36vw" loading="eager" />
            </div>
            {reel.map((s, i) => (
              <div className="hero__frame" key={s.image}>
                <Image src={s.image} alt="" fill sizes="(max-width: 820px) 100vw, 36vw" priority={i === 0} />
              </div>
            ))}
            <div className="hero__frame">
              <Image src={next.image} alt="" fill sizes="(max-width: 820px) 100vw, 36vw" />
            </div>
          </div>
          <div className={`hero__typed ${typedPicture ? "is-on" : ""}`} aria-hidden="true">
            {typedPicture && result.trade && <Image key={result.trade.image} src={result.trade.image} alt="" fill sizes="(max-width: 820px) 100vw, 36vw" />}
          </div>
        </div>

        <h1 className="display hero__sentence" aria-label={`${first} ${second}`}>
          <span className="hero__half hero__half--a" ref={firstRef}>
            <span key={`a-${first}`} className={`hero__word ${hasTyped ? "" : swapClass}`}>{first}</span>
          </span>
          <span className="hero__half hero__half--b" ref={secondRef}>
            <span key={`b-${second}`} className={`hero__word ${hasTyped ? "" : swapClass}`}>{second}</span>
          </span>
        </h1>

        <form className="hero__form" action="/job" method="get">
          <label className="hero__label" htmlFor="q">What’s wrong at home?</label>
          <input
            id="q"
            name="q"
            className="hero__input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Water under the sink"
            maxLength={140}
            autoComplete="off"
            enterKeyHint="search"
          />
          <button className="btn" type="submit">Find someone</button>
        </form>

        <p className="hero__support">
          Say it in your own words. Up to five people nearby reply, and you choose by their work.{" "}
          <span className="hero__browse">Or look around: <Link href="/workers" className="link hero__link">people ready to work</Link>, <Link href="/jobs" className="link hero__link">homes that need help</Link>.</span>
        </p>

        <div className="hero__answer" aria-live="polite">
          {hasTyped && result.emergency ? (
            <span className="hero__alert">{EMERGENCY_TEXT[result.emergency]}</span>
          ) : hasTyped && result.gated ? (
            <span>Care work opens after our safety checks are in place.</span>
          ) : answer ? (
            <Link href={hasTyped ? destination : `/trades/${answer.slug}`} className="link link--quiet">
              That’s a job for {answer.article} {answer.name}.
            </Link>
          ) : (
            <span>Keep going. Tell us a bit more.</span>
          )}
        </div>
      </div>
    </section>
  );
}
