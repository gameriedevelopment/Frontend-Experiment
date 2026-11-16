import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/motion";
import { DisplayTitle, Eyebrow } from "@/components/ui/SectionHeader";
import { links } from "@/config/links";
import { TokenField } from "./TokenField";

export function FinalCall() {
  return (
    <section className="px-gutter pb-4 sm:pb-6">
      <div className="relative mx-auto max-w-shell overflow-hidden rounded-panel bg-ink-950 text-mist-50">
        <TokenField className="absolute inset-0" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(48%_55%_at_50%_50%,var(--color-ink-950)_25%,transparent)]" />
        <Reveal className="pointer-events-none relative flex min-h-[40rem] flex-col items-center justify-center px-6 py-24 text-center">
          <Eyebrow>Your move</Eyebrow>
          <DisplayTitle lines={["Your next match", "starts here."]} className="mt-6" />
          <p className="mt-6 max-w-md text-lead text-mist-300">
            Create your player identity in a few minutes. It's free, and your record starts with your first game.
          </p>
          <div className="pointer-events-auto mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={links.register} size="lg" icon="arrowUpRight" orb>
              Create your player ID
            </ButtonLink>
            <ButtonLink href={links.discord} external tone="outline" size="lg" icon="discord">
              Join the Discord
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
