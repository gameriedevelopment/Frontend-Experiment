import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/motion";
import { Accent, SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import { proofLevels, proofSteps } from "../content/landing-content";
import { ProofPips, ProofVisual } from "./ProofVisual";

const STEP_MS = 5200;

export function ProofSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  const autoplay = inView && !reducedMotion;

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => setStep((current) => (current + 1) % proofSteps.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [autoplay, step, cycle]);

  const select = (index: number) => {
    setStep(index);
    setCycle((value) => value + 1);
  };

  return (
    <section id="proof" ref={sectionRef} className="scroll-mt-24 px-gutter pt-section">
      <div className="mx-auto max-w-shell">
        <Reveal>
          <SectionHeader
            tone="light"
            title={["How a result", "becomes proof."]}
            aside={
              <p>
                Every stat, level and leaderboard place on Gamerie comes from a recorded match. <Accent>Here's how one is made.</Accent>
              </p>
            }
          />
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
          <Reveal className="order-last lg:order-none lg:col-span-5">
            <ol className="grid gap-1">
              {proofSteps.map((item, index) => {
                const active = index === step;
                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      onClick={() => select(index)}
                      aria-current={active ? "step" : undefined}
                      className="group relative grid w-full gap-1.5 py-4 pl-7 text-left"
                    >
                      <span aria-hidden="true" className="absolute inset-y-3 left-0 w-0.5 overflow-hidden rounded-full bg-ink-950/10">
                        {active && (
                          <motion.span
                            key={`${step}-${cycle}`}
                            className="absolute inset-x-0 top-0 block bg-lavender-700"
                            initial={{ height: autoplay ? "0%" : "100%" }}
                            animate={{ height: "100%" }}
                            transition={{ duration: autoplay ? STEP_MS / 1000 : 0, ease: "linear" }}
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-semibold tracking-[-0.01em] transition-colors duration-500",
                          active ? "text-ink-950" : "text-ink-950/40 group-hover:text-ink-950/70",
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "grid transition-[grid-template-rows,opacity] duration-700 ease-out-expo",
                          active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <span className="overflow-hidden text-[0.95rem] leading-relaxed text-ink-700">{item.copy}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <ProofVisual step={step} />
          </Reveal>
        </div>

        <Reveal className="mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-ink-950/10 pt-8">
            <h3 className="text-lg font-semibold tracking-[-0.01em]">Proof levels</h3>
            <p className="text-sm text-ink-700/70">Every recorded match keeps its source.</p>
          </div>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {proofLevels.map((level) => (
              <li key={level.label} className="grid gap-3">
                <span className="flex items-center gap-3 text-lavender-700">
                  <ProofPips strength={level.strength} />
                  <span className="font-semibold text-ink-950">{level.label}</span>
                </span>
                <p className="max-w-xs text-[0.95rem] leading-relaxed text-ink-700">{level.copy}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
