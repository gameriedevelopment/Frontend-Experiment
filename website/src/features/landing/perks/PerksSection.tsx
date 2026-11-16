import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";
import { Accent, SectionHeader } from "@/components/ui/SectionHeader";
import { links } from "@/config/links";
import { cn } from "@/lib/cn";
import { perks, type Rarity } from "../content/landing-content";

const rarityText = {
  Legendary: "text-signal",
  Epic: "text-lavender-300",
  Rare: "text-mist-400",
} as const satisfies Record<Rarity, string>;

function PerkTile({ perk }: { perk: (typeof perks)[number] }) {
  return (
    <li className="flex flex-col gap-6 rounded-card bg-white/[0.03] p-7 ring-1 ring-inset ring-white/6 transition-colors duration-500 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.05] text-lavender-300">
          <Icon name={perk.icon} className="size-6" weight="duotone" />
        </span>
        <span className={cn("text-xs font-medium", rarityText[perk.rarity])}>{perk.rarity}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.01em]">{perk.title}</h3>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-mist-400">{perk.copy}</p>
      </div>
    </li>
  );
}

export function PerksSection() {
  return (
    <section className="px-gutter pt-section">
      <div className="relative mx-auto max-w-shell overflow-hidden rounded-panel bg-ink-950 px-6 py-14 text-mist-50 sm:px-10 sm:py-20 lg:px-16">
        <div aria-hidden="true" className="halftone absolute inset-0 text-lavender-400/[0.06] mask-[radial-gradient(55%_55%_at_85%_0%,black,transparent)]" />
        <div className="relative">
          <Reveal>
            <SectionHeader
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
