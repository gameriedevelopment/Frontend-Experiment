import { Icon } from "@/components/ui/Icon";
import type { HostedTournamentDetail } from "../types";
import { ruleSections } from "./rules";

export function RulesTab({ tournament }: { tournament: HostedTournamentDetail }) {
  const sections = ruleSections(tournament);
  const organizerText = tournament.matchRules?.rulesText?.trim();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
      <nav aria-label="Rule sections" className="hidden lg:sticky lg:top-24 lg:block">
        <ol className="grid gap-1">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#rules-${section.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-mist-400 transition-colors hover:bg-white/4 hover:text-mist-50"
              >
                <span className="type-label w-4 text-mist-500">{index + 1}</span>
                {section.title}
              </a>
            </li>
          ))}
          {organizerText && (
            <li>
              <a
                href="#rules-organizer"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-mist-400 transition-colors hover:bg-white/4 hover:text-mist-50"
              >
                <span className="type-label w-4 text-mist-500">{sections.length + 1}</span>
                House rules
              </a>
            </li>
          )}
        </ol>
      </nav>

      <div className="grid gap-4">
        <p className="flex items-start gap-2.5 rounded-2xl bg-white/3 px-4 py-3 text-sm text-mist-300 ring-1 ring-inset ring-white/6">
          <Icon name="info" className="mt-0.5 size-4 shrink-0 text-lavender-300" />
          Set by {tournament.official ? "Gamerie" : tournament.host.name}. Gamerie's platform rules always apply.
        </p>
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={`rules-${section.id}`}
            className="scroll-mt-24 rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6"
          >
            <h2 className="flex items-center gap-3 text-base font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-lavender-400/12 text-xs font-semibold text-lavender-300">
                {index + 1}
              </span>
              {section.title}
            </h2>
            <ol className="mt-4 grid gap-3">
              {section.rules.map((rule, ruleIndex) => (
                <li key={rule} className="grid grid-cols-[2.25rem_minmax(0,1fr)] text-[0.95rem] leading-relaxed text-mist-300">
                  <span className="type-label pt-1 text-mist-500">
                    {index + 1}.{ruleIndex + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
        {organizerText && (
          <section id="rules-organizer" className="scroll-mt-24 rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
            <h2 className="text-base font-semibold">House rules</h2>
            <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-mist-300">{organizerText}</p>
          </section>
        )}
      </div>
    </div>
  );
}
