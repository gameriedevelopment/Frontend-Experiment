import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo, Reveal } from "@/components/ui/motion";
import { DisplayTitle, Eyebrow } from "@/components/ui/SectionHeader";
import { links } from "@/config/links";
import { cn } from "@/lib/cn";
import { faqs } from "../content/landing-content";

function FaqItem({
  question,
  answer,
  index,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  return (
    <li className="border-b border-ink-950/10">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="group flex w-full items-center gap-5 py-6 text-left outline-none focus-visible:text-lavender-700"
        >
          <span className="type-label w-6 shrink-0 text-ink-950/40">0{index + 1}</span>
          <span className="flex-1 text-lg font-semibold tracking-[-0.01em] sm:text-xl">{question}</span>
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,color,rotate] duration-500 ease-out-expo",
              open ? "rotate-45 bg-ink-950 text-lavender-300" : "bg-ink-950/6 group-hover:bg-ink-950/10",
            )}
          >
            <Icon name="plus" className="size-4" strokeWidth={2} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-7 pl-11 text-[1.02rem] leading-relaxed text-ink-700">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="scroll-mt-24 px-gutter py-section">
      <div className="mx-auto grid max-w-shell gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Eyebrow tone="light">FAQ</Eyebrow>
            <DisplayTitle tone="light" lines={["Questions,", "answered."]} className="mt-6" />
            <Card surface="outline" padding="sm" className="mt-10 max-w-sm">
              <p className="text-[0.95rem] leading-relaxed text-ink-700">
                Still curious? The team and early players hang out on Discord.
              </p>
              <ButtonLink href={links.discord} external tone="ink" size="sm" icon="arrowUpRight" orb className="mt-5">
                Join the Discord
              </ButtonLink>
            </Card>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-7">
          <ul className="border-t border-ink-950/10">
            {faqs.map((faq, index) => (
              <FaqItem
                key={faq.question}
                {...faq}
                index={index}
                open={open === index}
                onToggle={() => setOpen(open === index ? -1 : index)}
              />
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
