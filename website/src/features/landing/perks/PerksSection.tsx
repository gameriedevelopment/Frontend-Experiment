import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";
import { Accent, SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { links } from "@/config/links";
import { cn } from "@/lib/cn";
import { perks, type Rarity } from "../content/landing-content";

const rarityTone = {
  Legendary: { tag: "signal", frame: "ring-signal/50 text-signal", fill: "bg-signal" },
  Epic: { tag: "lavender", frame: "ring-lavender-400/45 text-lavender-300", fill: "bg-lavender-400" },
  Rare: { tag: "muted", frame: "ring-white/20 text-mist-200", fill: "bg-mist-200" },
} as const satisfies Record<Rarity, { tag: "signal" | "lavender" | "muted"; frame: string; fill: string }>;

function PerkTile({ perk }: { perk: (typeof perks)[number] }) {
  const tone = rarityTone[perk.rarity];
  return (
    <li className="group relative flex flex-col rounded-card bg-white/[0.03] p-6 ring-1 ring-inset ring-white/8 transition-[background-color,box-shadow,translate] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white/[0.055] hover:ring-white/15 sm:p-7">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-12 rotate-45 place-items-center rounded-[0.8rem] bg-ink-900 ring-1 transition-transform duration-700 ease-out-expo group-hover:rotate-[225deg]",
            tone.frame,
          )}
        >
          <Icon name={perk.icon} className="size-5 -rotate-45" />
        </span>
        <Tag tone={tone.tag}>{perk.rarity}</Tag>
      </div>
      <h3 className="type-display mt-7 text-[1.15rem] leading-tight">{perk.title}</h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-mist-400">{perk.copy}</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
          <div
            className={cn(
              "h-full w-1/5 rounded-full transition-[width] duration-700 ease-out-expo group-hover:w-full",
              tone.fill,
            )}
          />
        </div>
        <span className="type-label flex items-center gap-1.5 text-mist-500 transition-colors group-hover:text-mist-200">
          <Icon name="lock" className="size-3 group-hover:hidden" strokeWidth={2} />
          <Icon name="check" className="hidden size-3 group-hover:block" strokeWidth={2.4} />
          On sign-up
        </span>
      </div>
    </li>
  );
}

export function PerksSection() {
  return (
    <section className="px-gutter">
      <div className="relative mx-auto max-w-shell overflow-hidden rounded-panel bg-ink-950 px-6 py-14 text-mist-50 sm:px-10 sm:py-20 lg:px-16">
        <div aria-hidden="true" className="halftone absolute inset-0 text-lavender-400/10 [mask-image:radial-gradient(60%_60%_at_85%_0%,black,transparent)]" />
        <div className="relative">
          <Reveal>
            <SectionHeader
              eyebrow="Early access"
              title={["Early players", "get the loot."]}
              aside={
                <div className="space-y-6">
                  <p>
                    Join now and these unlock on your profile. <Accent>Some of them never come back.</Accent>
                  </p>
                  <ButtonLink href={links.register} icon="arrowUpRight" orb>
                    Claim your username
                  </ButtonLink>
                </div>
              }
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {perks.map((perk) => (
                <PerkTile key={perk.title} perk={perk} />
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
