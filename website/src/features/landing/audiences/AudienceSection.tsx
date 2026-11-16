import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";
import { Accent, SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { audiences } from "../content/landing-content";

type Audience = (typeof audiences)[number];

function AudiencePanel({
  audience,
  index,
  active,
  onActivate,
}: {
  audience: Audience;
  index: number;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <article
      tabIndex={0}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      aria-label={audience.label}
      className={cn(
        "group relative isolate flex h-[27rem] overflow-hidden rounded-card bg-ink-950 text-mist-50 outline-none transition-[flex-grow] duration-700 ease-out-expo focus-visible:ring-2 focus-visible:ring-lavender-600 focus-visible:ring-offset-4 focus-visible:ring-offset-paper lg:h-auto lg:basis-0",
        active ? "lg:grow-[3.4]" : "lg:grow",
      )}
    >
      <img
        src={audience.image}
        alt={audience.imageAlt}
        loading="lazy"
        className={cn(
          "absolute inset-0 -z-10 size-full object-cover grayscale contrast-125 transition-[scale,filter] duration-[1.2s] ease-out-expo",
          active ? "scale-100 brightness-90" : "scale-110 brightness-75",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 -z-10 bg-lavender-500 mix-blend-multiply transition-opacity duration-700",
          active ? "opacity-70" : "opacity-95",
        )}
      />
      <div className="halftone absolute inset-0 -z-10 text-ink-950/45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/5" />

      <div className="flex w-full flex-col justify-between p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <Tag tone="ink" size="md">
            <Icon name={audience.icon} className="size-3.5" strokeWidth={2} />
            {audience.label}
          </Tag>
          <span className="type-label text-mist-300">0{index + 1}</span>
        </div>

        <span
          aria-hidden="true"
          className={cn(
            "type-display hidden self-start text-[1.2rem] leading-none text-lavender-200 transition-opacity duration-500 [writing-mode:vertical-rl] lg:block lg:rotate-180",
            active ? "lg:hidden" : "lg:opacity-100",
          )}
        >
          {audience.label}
        </span>

        <div
          className={cn(
            "max-w-md transition-[opacity,translate] duration-700 ease-out-expo",
            active ? "lg:translate-y-0 lg:opacity-100" : "lg:pointer-events-none lg:absolute lg:translate-y-6 lg:opacity-0",
          )}
        >
          <h3 className="type-display text-display-sm text-balance">{audience.title}</h3>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-mist-200">{audience.copy}</p>
        </div>
      </div>
    </article>
  );
}

export function AudienceSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="audiences" className="scroll-mt-24 px-gutter py-section">
      <div className="mx-auto max-w-shell">
        <Reveal>
          <SectionHeader
            tone="light"
            eyebrow="Who it's for"
            title={["Built for every", "side of the game."]}
            aside={
              <p>
                Players, teams, communities and organizers on one connected board, <Accent>each with a reason to show up.</Accent>
              </p>
            }
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-14 flex flex-col gap-3 lg:h-[36rem] lg:flex-row">
          {audiences.map((audience, index) => (
            <AudiencePanel
              key={audience.label}
              audience={audience}
              index={index}
              active={active === index}
              onActivate={() => setActive(index)}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
