import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";
import { Accent, SectionHeader } from "@/components/ui/SectionHeader";
import { links } from "@/config/links";
import { gpActions } from "../content/landing-content";

export function ProgressionSection() {
  return (
    <section className="px-gutter pt-section">
      <div className="relative mx-auto max-w-shell overflow-hidden rounded-panel bg-ink-950 px-6 py-14 text-mist-50 sm:px-10 sm:py-20 lg:px-16">
        <div
          aria-hidden="true"
          className="halftone absolute inset-0 text-lavender-400/[0.06] mask-[radial-gradient(55%_55%_at_85%_0%,black,transparent)]"
        />
        <div className="relative">
          <Reveal>
            <SectionHeader
              title={["Every move", "earns GP."]}
              aside={
                <div className="space-y-6">
                  <p>
                    GP builds your level, and your level shows on your Player Card. Streaks and achievements build on top.{" "}
                    <Accent>Here's some of what counts.</Accent>
                  </p>
                  <ButtonLink href={links.register} icon="arrowUpRight" orb>
                    Create your player ID
                  </ButtonLink>
                </div>
              }
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gpActions.map((action) => (
                <li
                  key={action.title}
                  className="flex flex-col gap-6 rounded-card bg-white/[0.03] p-7 ring-1 ring-inset ring-white/6 transition-colors duration-500 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.05] text-lavender-300">
                      <Icon name={action.icon} className="size-6" weight="duotone" />
                    </span>
                    <span className="text-xs font-medium text-mist-500">{action.group}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.01em]">{action.title}</h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-mist-400">{action.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
