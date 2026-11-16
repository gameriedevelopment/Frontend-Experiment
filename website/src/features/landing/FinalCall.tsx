import { GamerieIcon } from "../../components/ui/GamerieIcon";
import { ActionLink } from "../../components/ui/ActionLink";
import { Container, SectionHeading } from "../../components/ui/Section";
import { links } from "../../links";

export function FinalCall() {
  return (
    <section
      aria-labelledby="join-title"
      className="relative isolate overflow-hidden bg-brand py-section text-ink"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[repeating-radial-gradient(ellipse_at_95%_110%,transparent_0_29px,var(--color-violet-ink)_30px,transparent_31px_45px)] opacity-25 [mask-image:linear-gradient(85deg,transparent_24%,black_91%)]"
      />
      <Container>
        <SectionHeading id="join-title" className="max-w-[12ch]">
          Your player identity starts here.
        </SectionHeading>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-9">
          <ActionLink href={links.register} variant="inverse">
            Create your identity <GamerieIcon name="external" size={17} />
          </ActionLink>
          <a
            href={links.signIn}
            className="rounded-full text-base font-bold underline decoration-ink/45 underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Sign in
          </a>
        </div>
      </Container>
    </section>
  );
}
